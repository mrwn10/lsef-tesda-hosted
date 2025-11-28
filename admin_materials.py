from flask import Blueprint, render_template, request, redirect, url_for, flash, session, send_from_directory
from database import get_db
from datetime import datetime
import os
from werkzeug.utils import secure_filename

admin_materials_bp = Blueprint('admin_materials', __name__)

UPLOAD_FOLDER = os.path.join("static", "uploads", "materials")
ALLOWED_EXTENSIONS = {"pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "jpg", "png"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if uploaded file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@admin_materials_bp.route("/admin/materials", methods=["GET", "POST"])
def materials():
    """Admin upload, view, and edit materials or announcements with global option."""
    if "user_id" not in session or session.get("role") != "admin":
        flash("Unauthorized access. Please login as admin.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)
    admin_user_id = session.get("user_id")

    profile_picture = "default.png"
    cursor.execute(
        """
        SELECT profile_picture
        FROM personal_information
        WHERE user_id = %s
        """,
        (admin_user_id,)
    )
    user = cursor.fetchone()
    if user and user.get("profile_picture"):
        profile_picture = user["profile_picture"]

    if request.method == "POST":
        material_id = request.form.get("material_id")
        title = request.form.get("title")
        description = request.form.get("description")
        type_ = request.form.get("type")
        class_id = request.form.get("class_id") or None
        
        if class_id == "all":
            class_id = None
        
        submission_start = None
        submission_end = None
        if type_ == "classwork":
            submission_start_str = request.form.get("submission_start")
            submission_end_str = request.form.get("submission_end")
            
            if submission_start_str:
                try:
                    submission_start = datetime.strptime(submission_start_str, '%Y-%m-%dT%H:%M')
                except ValueError:
                    flash("Invalid submission start date format.")
            if submission_end_str:
                try:
                    submission_end = datetime.strptime(submission_end_str, '%Y-%m-%dT%H:%M')
                except ValueError:
                    flash("Invalid submission end date format.")

        file = request.files.get("file")
        stored_filename = None
        original_filename = None
        mimetype = None
        file_size = None

        if file and file.filename != '' and allowed_file(file.filename):
            original_filename = secure_filename(file.filename)
            stored_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{original_filename}"
            filepath = os.path.join(UPLOAD_FOLDER, stored_filename)
            file.save(filepath)
            mimetype = file.mimetype
            file_size = os.path.getsize(filepath)

        if material_id:
            cursor.execute(
                "SELECT instructor_id FROM materials WHERE material_id = %s",
                (material_id,)
            )
            material = cursor.fetchone()
            
            if not material or material["instructor_id"] != admin_user_id:
                flash("Unauthorized to update this material.")
                return redirect(url_for("admin_materials.materials"))
                
            if stored_filename:
                cursor.execute(
                    """
                    UPDATE materials
                    SET class_id=%s, title=%s, description=%s, type=%s,
                        original_filename=%s, stored_filename=%s, mimetype=%s, file_size=%s,
                        submission_start=%s, submission_end=%s
                    WHERE material_id=%s AND instructor_id=%s
                    """,
                    (class_id, title, description, type_,
                     original_filename, stored_filename, mimetype, file_size,
                     submission_start, submission_end,
                     material_id, admin_user_id)
                )
            else:
                cursor.execute(
                    """
                    UPDATE materials
                    SET class_id=%s, title=%s, description=%s, type=%s,
                        submission_start=%s, submission_end=%s
                    WHERE material_id=%s AND instructor_id=%s
                    """,
                    (class_id, title, description, type_, 
                     submission_start, submission_end,
                     material_id, admin_user_id)
                )
            db.commit()
            flash("Material updated successfully.")
        else:
            
            cursor.execute(
                """
                SELECT first_name, last_name
                FROM personal_information
                WHERE user_id = %s
                """,
                (admin_user_id,)
            )
            admin = cursor.fetchone()
            instructor_name = f"{admin['first_name']} {admin['last_name']}" if admin else "Administrator"

            cursor.execute(
                """
                INSERT INTO materials (class_id, instructor_id, instructor_name, title, description, type,
                                       original_filename, stored_filename, mimetype, file_size, 
                                       submission_start, submission_end, date_uploaded)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (class_id, admin_user_id, instructor_name, title, description, type_,
                 original_filename, stored_filename, mimetype, file_size,
                 submission_start, submission_end)
            )
            db.commit()
            flash("Material uploaded successfully.")

        return redirect(url_for("admin_materials.materials"))

    cursor.execute(
        """
        SELECT m.*, c.class_title,
               DATE_FORMAT(m.submission_start, '%Y-%m-%dT%H:%i') as submission_start_formatted,
               DATE_FORMAT(m.submission_end, '%Y-%m-%dT%H:%i') as submission_end_formatted,
               CASE WHEN m.class_id IS NULL THEN 'All Classes' ELSE c.class_title END as display_class
        FROM materials m
        LEFT JOIN classes c ON m.class_id = c.class_id
        WHERE m.instructor_id = %s
        ORDER BY m.date_uploaded DESC
        """,
        (admin_user_id,)
    )
    materials = cursor.fetchall()

    cursor.execute(
        """
        SELECT class_id, class_title, instructor_name
        FROM classes
        WHERE status = 'active'
        ORDER BY class_title ASC
        """
    )
    classes = cursor.fetchall()

    return render_template(
        "admin/admin_materials.html",
        materials=materials,
        classes=classes,
        profile_picture=profile_picture
    )


@admin_materials_bp.route("/admin/materials/preview/<filename>")
def preview_material(filename):
    """Preview uploaded materials without forcing download."""
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)


@admin_materials_bp.route("/admin/materials/check/<int:material_id>")
def check_submissions(material_id):
    """Admin checks which students submitted and who has not."""
    if "user_id" not in session or session.get("role") != "admin":
        flash("Unauthorized access. Please login as admin.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)
    admin_user_id = session.get("user_id")

    cursor.execute(
        """
        SELECT m.*, c.class_title,
               DATE_FORMAT(m.submission_start, '%Y-%m-%d %H:%i') as submission_start_formatted,
               DATE_FORMAT(m.submission_end, '%Y-%m-%d %H:%i') as submission_end_formatted
        FROM materials m
        LEFT JOIN classes c ON m.class_id = c.class_id
        WHERE m.material_id = %s AND m.instructor_id = %s
        """,
        (material_id, admin_user_id)
    )
    material = cursor.fetchone()

    if not material or material["type"] != "classwork":
        flash("Invalid classwork or unauthorized access.")
        return redirect(url_for("admin_materials.materials"))

    # For global classwork, get all enrolled students
    if material["class_id"] is None:
        cursor.execute(
            """
            SELECT pi.user_id, pi.first_name, pi.last_name
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            WHERE e.status = 'enrolled'
            """
        )
    else:
        cursor.execute(
            """
            SELECT pi.user_id, pi.first_name, pi.last_name
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            WHERE e.class_id = %s AND e.status = 'enrolled'
            """,
            (material["class_id"],)
        )
    enrolled_students = cursor.fetchall()

    cursor.execute(
        """
        SELECT s.*, pi.first_name, pi.last_name
        FROM submissions s
        JOIN personal_information pi ON s.student_id = pi.user_id
        WHERE s.material_id = %s
        """,
        (material_id,)
    )
    submissions = cursor.fetchall()

    submitted_ids = {s["student_id"] for s in submissions}

    for student in enrolled_students:
        student["submitted"] = student["user_id"] in submitted_ids
        if student["submitted"]:
            student["submission"] = next(s for s in submissions if s["student_id"] == student["user_id"])

    return render_template("admin/admin_check.html", material=material, students=enrolled_students)


@admin_materials_bp.route("/admin/materials/delete/<int:material_id>", methods=["POST"])
def delete_material(material_id):
    """Delete a material."""
    if "user_id" not in session or session.get("role") != "admin":
        flash("Unauthorized access.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor()
    
    cursor.execute(
        "DELETE FROM materials WHERE material_id = %s AND instructor_id = %s",
        (material_id, session.get("user_id"))
    )
    db.commit()
    
    flash("Material deleted successfully.")
    return redirect(url_for("admin_materials.materials"))