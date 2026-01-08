from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database import get_db
import os
from werkzeug.utils import secure_filename

student_requirements_bp = Blueprint("student_requirements", __name__)

UPLOAD_FOLDER = os.path.join("static", "uploads", "requirements")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@student_requirements_bp.route("/student/requirements", methods=["GET", "POST"])
def upload_requirements():
    if "user_id" not in session or session.get("role") != "student":
        flash("Unauthorized access. Please login as student.")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True, buffered=True)
    user_id = session["user_id"]

    # Get user profile info
    profile_picture = "default.png"
    gender = None
    verified_status = None  # NEW: Store verification status

    cursor.execute("""
        SELECT profile_picture, gender
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()

    if user:
        profile_picture = user.get("profile_picture") or profile_picture
        gender = (user.get("gender") or "").lower()

    # NEW: Get verification status from login table
    cursor.execute("""
        SELECT verified FROM login
        WHERE user_id = %s
    """, (user_id,))
    login_info = cursor.fetchone()
    if login_info:
        verified_status = login_info.get("verified")

    if request.method == "POST":
        uploaded_files = {}

        required_fields = [
            "valid_id",
            "medical_certificate",
            "transcript_form",
        ]

        optional_fields = [
            "barangay_clearance",
        ]

        missing_required = []
        for field in required_fields:
            file = request.files.get(field)
            if not file or not file.filename:
                missing_required.append(field.replace("_", " ").title())
            elif allowed_file(file.filename):
                filename = secure_filename(f"{user_id}_{field}_{file.filename}")
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                uploaded_files[field] = filename
            else:
                flash(f"Invalid file type for {field.replace('_', ' ')}.", "error")
                return redirect(url_for("student_requirements.upload_requirements"))

        if missing_required:
            flash(
                f"Please upload all required documents: {', '.join(missing_required)}",
                "error"
            )
            return redirect(url_for("student_requirements.upload_requirements"))

        for field in optional_fields:
            file = request.files.get(field)
            if file and file.filename:
                if allowed_file(file.filename):
                    filename = secure_filename(f"{user_id}_{field}_{file.filename}")
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    uploaded_files[field] = filename
                else:
                    flash(f"Invalid file type for {field.replace('_', ' ')}.", "error")
                    return redirect(url_for("student_requirements.upload_requirements"))
            else:
                uploaded_files[field] = None

        marriage_file = request.files.get("marriage_certificate")
        if gender == "female" and marriage_file and marriage_file.filename:
            if not allowed_file(marriage_file.filename):
                flash("Invalid file type for marriage certificate.", "error")
                return redirect(url_for("student_requirements.upload_requirements"))

            filename = secure_filename(
                f"{user_id}_marriage_certificate_{marriage_file.filename}"
            )
            marriage_file.save(os.path.join(UPLOAD_FOLDER, filename))
            uploaded_files["marriage_certificate"] = filename
        else:
            uploaded_files["marriage_certificate"] = None

        additional_notes = request.form.get("additional_notes", "")

        try:
            # NEW: Check if this is a resubmission after rejection
            cursor.execute("SELECT requirement_id FROM student_requirements WHERE user_id = %s", (user_id,))
            existing_record = cursor.fetchone()
            
            if existing_record:
                # Update existing record (resubmission after rejection or editing)
                cursor.execute("""
                    UPDATE student_requirements
                    SET barangay_clearance = %s,
                        valid_id = %s,
                        medical_certificate = %s,
                        transcript_form = %s,
                        marriage_certificate = %s,
                        additional_notes = %s,
                        date_uploaded = NOW()
                    WHERE user_id = %s
                """, (
                    uploaded_files.get("barangay_clearance"),
                    uploaded_files.get("valid_id"),
                    uploaded_files.get("medical_certificate"),
                    uploaded_files.get("transcript_form"),
                    uploaded_files.get("marriage_certificate"),
                    additional_notes,
                    user_id
                ))
                action_message = "updated"
            else:
                # First-time submission
                cursor.execute("""
                    INSERT INTO student_requirements
                    (user_id, barangay_clearance, valid_id, medical_certificate,
                     transcript_form, marriage_certificate, additional_notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    uploaded_files.get("barangay_clearance"),
                    uploaded_files.get("valid_id"),
                    uploaded_files.get("medical_certificate"),
                    uploaded_files.get("transcript_form"),
                    uploaded_files.get("marriage_certificate"),
                    additional_notes
                ))
                action_message = "uploaded"

            # NEW: Always set to pending when submitting/resubmitting
            cursor.execute("""
                UPDATE login
                SET verified = 'pending'
                WHERE user_id = %s AND role = 'student'
            """, (user_id,))

            db.commit()
            
            if verified_status == 'rejected':
                flash(
                    "Your requirements have been resubmitted successfully and are pending verification.",
                    "success"
                )
            else:
                flash(
                    f"Your TESDA requirements have been {action_message} successfully and are pending verification.",
                    "success"
                )

        except Exception as e:
            db.rollback()
            print("Upload error:", e)
            flash("An error occurred while uploading your requirements.", "error")

        return redirect(url_for("student_requirements.upload_requirements"))

    # GET request - show form
    cursor.execute(
        "SELECT * FROM student_requirements WHERE user_id = %s",
        (user_id,)
    )
    existing = cursor.fetchone()

    cursor.close()

    return render_template(
        "students/student_requirements.html",
        existing=existing,
        profile_picture=profile_picture,
        gender=gender,
        verified_status=verified_status  # NEW: Pass verification status to template
    )