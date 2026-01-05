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
    cursor = db.cursor(dictionary=True, buffered=True)  # ✅ FIX
    user_id = session["user_id"]

    profile_picture = "default.png"
    gender = None

    cursor.execute("""
        SELECT profile_picture, gender
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()

    if user:
        profile_picture = user.get("profile_picture") or profile_picture
        gender = (user.get("gender") or "").lower()

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
            cursor.execute("""
                INSERT INTO student_requirements
                (user_id, barangay_clearance, valid_id, medical_certificate,
                 transcript_form, marriage_certificate, additional_notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    barangay_clearance = VALUES(barangay_clearance),
                    valid_id = VALUES(valid_id),
                    medical_certificate = VALUES(medical_certificate),
                    transcript_form = VALUES(transcript_form),
                    marriage_certificate = VALUES(marriage_certificate),
                    additional_notes = VALUES(additional_notes),
                    date_uploaded = NOW()
            """, (
                user_id,
                uploaded_files.get("barangay_clearance"),
                uploaded_files.get("valid_id"),
                uploaded_files.get("medical_certificate"),
                uploaded_files.get("transcript_form"),
                uploaded_files.get("marriage_certificate"),
                additional_notes
            ))

            cursor.execute("""
                UPDATE login
                SET verified = 'pending'
                WHERE user_id = %s AND role = 'student'
            """, (user_id,))

            db.commit()
            flash(
                "Your TESDA requirements have been uploaded successfully and are pending verification.",
                "success"
            )

        except Exception as e:
            db.rollback()
            print("Upload error:", e)
            flash("An error occurred while uploading your requirements.", "error")

        return redirect(url_for("student_requirements.upload_requirements"))

    cursor.execute(
        "SELECT * FROM student_requirements WHERE user_id = %s",
        (user_id,)
    )
    existing = cursor.fetchone()

    cursor.close()  # ✅ now SAFE

    return render_template(
        "students/student_requirements.html",
        existing=existing,
        profile_picture=profile_picture,
        gender=gender
    )
