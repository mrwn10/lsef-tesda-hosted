from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database import get_db
from datetime import datetime
import os
from werkzeug.utils import secure_filename

student_resources_bp = Blueprint('student_resources', __name__)

# Folder for student submissions
UPLOAD_FOLDER = os.path.join("static", "uploads", "student_submissions")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "jpg", "png", "jpeg"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@student_resources_bp.route("/resources")
def resources():
    """Show announcements and classwork for enrolled classes PLUS global announcements (class_id = null)"""
    if "user_id" not in session or session.get("role") != "student":
        flash("Unauthorized access. Please login as student.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Get student profile picture
    cursor.execute(
        """
        SELECT pi.profile_picture 
        FROM personal_information pi 
        WHERE pi.user_id = %s
        """,
        (session["user_id"],)
    )
    profile_data = cursor.fetchone()
    profile_picture = profile_data["profile_picture"] if profile_data else None

    # ✅ Get all class_ids where student is enrolled
    cursor.execute(
        "SELECT class_id FROM enrollment WHERE user_id = %s AND status = 'enrolled'",
        (session["user_id"],)
    )
    enrolled_classes = [row["class_id"] for row in cursor.fetchall()]

    # ✅ Announcements: enrolled classes + global announcements (class_id IS NULL)
    if enrolled_classes:
        placeholders = ",".join(["%s"] * len(enrolled_classes))
        cursor.execute(
            f"""
            SELECT m.*, c.class_title, c.instructor_name
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.class_id
            WHERE m.type = 'announcement'
            AND (m.class_id IN ({placeholders}) OR m.class_id IS NULL)
            ORDER BY m.date_uploaded DESC
            """,
            enrolled_classes
        )
    else:
        # If not enrolled in any classes, only show global announcements
        cursor.execute(
            """
            SELECT m.*, c.class_title, c.instructor_name
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.class_id
            WHERE m.type = 'announcement' AND m.class_id IS NULL
            ORDER BY m.date_uploaded DESC
            """
        )
    announcements = cursor.fetchall()

    # ✅ Classwork: only for enrolled classes
    if enrolled_classes:
        placeholders = ",".join(["%s"] * len(enrolled_classes))
        cursor.execute(
            f"""
            SELECT m.*, c.class_title, c.instructor_name,
                   DATE_FORMAT(m.submission_start, '%Y-%m-%dT%H:%i') as submission_start_formatted,
                   DATE_FORMAT(m.submission_end, '%Y-%m-%dT%H:%i') as submission_end_formatted
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.class_id
            WHERE m.type = 'classwork'
            AND m.class_id IN ({placeholders})
            ORDER BY m.date_uploaded DESC
            """,
            enrolled_classes
        )
        classworks = cursor.fetchall()
    else:
        classworks = []

    cursor.close()

    return render_template("students/student_resources.html",
                           announcements=announcements,
                           classworks=classworks,
                           profile_picture=profile_picture,
                           user_id=session["user_id"])

@student_resources_bp.route("/resources/classwork/<int:material_id>", methods=["GET", "POST"])
def view_classwork(material_id):
    """View classwork details and allow student submission with time validation"""
    if "user_id" not in session or session.get("role") != "student":
        flash("Unauthorized access. Please login as student.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Get student profile picture
    cursor.execute(
        """
        SELECT pi.profile_picture 
        FROM personal_information pi 
        WHERE pi.user_id = %s
        """,
        (session["user_id"],)
    )
    profile_data = cursor.fetchone()
    profile_picture = profile_data["profile_picture"] if profile_data else None

    # ✅ Fetch classwork details with formatted dates
    cursor.execute(
        """
        SELECT m.*, c.class_title, c.instructor_name,
               DATE_FORMAT(m.submission_start, '%Y-%m-%d %H:%i') as submission_start_formatted,
               DATE_FORMAT(m.submission_end, '%Y-%m-%d %H:%i') as submission_end_formatted
        FROM materials m
        LEFT JOIN classes c ON m.class_id = c.class_id
        WHERE m.material_id = %s AND m.type = 'classwork'
        """,
        (material_id,)
    )
    classwork = cursor.fetchone()

    if not classwork:
        flash("Classwork not found.")
        return redirect(url_for("student_resources.resources"))

    # ✅ Ensure student is enrolled in this class
    cursor.execute(
        "SELECT 1 FROM enrollment WHERE user_id = %s AND class_id = %s AND status = 'enrolled'",
        (session["user_id"], classwork["class_id"])
    )
    if not cursor.fetchone():
        flash("You are not enrolled in this class.")
        return redirect(url_for("student_resources.resources"))

    # ✅ Check if submission is currently allowed based on time
    current_time = datetime.now()
    submission_allowed = False
    submission_status = "not_started"
    
    if classwork["submission_start"] and classwork["submission_end"]:
        submission_start = classwork["submission_start"]
        submission_end = classwork["submission_end"]
        
        if current_time < submission_start:
            submission_status = "not_started"
        elif current_time <= submission_end:
            submission_status = "open"
            submission_allowed = True
        else:
            submission_status = "closed"

    # ✅ Handle submission (only if allowed)
    if request.method == "POST" and submission_allowed:
        file = request.files.get("submission")
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            stored_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, stored_filename)
            file.save(filepath)

            cursor.execute(
                """
                INSERT INTO submissions (material_id, student_id, stored_filename, original_filename, date_submitted)
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (material_id, session["user_id"], stored_filename, filename)
            )
            db.commit()
            flash("Your work has been submitted successfully.")
            return redirect(url_for("student_resources.view_classwork", material_id=material_id))
        else:
            flash("Invalid file type. Allowed: pdf, doc, docx, jpg, png, jpeg")

    # ✅ Fetch student's submissions
    cursor.execute(
        """
        SELECT *,
               DATE_FORMAT(date_submitted, '%Y-%m-%d %H:%i') as date_submitted_formatted
        FROM submissions
        WHERE material_id = %s AND student_id = %s
        ORDER BY date_submitted DESC
        """,
        (material_id, session["user_id"])
    )
    submissions = cursor.fetchall()

    # Check if student has submitted
    has_submitted = len(submissions) > 0

    cursor.close()

    return render_template("students/student_classwork.html",
                           classwork=classwork,
                           submissions=submissions,
                           profile_picture=profile_picture,
                           user_id=session["user_id"],
                           submission_allowed=submission_allowed,
                           submission_status=submission_status,
                           has_submitted=has_submitted,
                           current_time=current_time)