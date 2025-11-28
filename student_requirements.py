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
    cursor = db.cursor(dictionary=True)
    user_id = session["user_id"]

    profile_picture = "default.png"
    cursor.execute("""
        SELECT profile_picture
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()
    if user and user.get("profile_picture"):
        profile_picture = user["profile_picture"]

    if request.method == "POST":
        uploaded_files = {}
        required_fields = [
            "birth_certificate",
            "educational_credentials",
            "id_photos",
            "barangay_clearance",
            "medical_certificate",
            "valid_id",
            "transcript_form",
            "good_moral_certificate",
            "brown_envelope",
        ]
        
        # Marriage certificate is optional
        optional_fields = ["marriage_certificate"]

        # Check required fields
        missing_required = []
        for field in required_fields:
            file = request.files.get(field)
            if not file or not file.filename:
                missing_required.append(field.replace('_', ' ').title())
            elif file and allowed_file(file.filename):
                filename = secure_filename(f"{user_id}_{field}_{file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                uploaded_files[field] = filename

        # Handle marriage certificate based on marital status
        marital_status = request.form.get("marital_status", "")
        marriage_file = request.files.get("marriage_certificate")
        
        if marital_status == "married" and marriage_file and marriage_file.filename:
            if allowed_file(marriage_file.filename):
                filename = secure_filename(f"{user_id}_marriage_certificate_{marriage_file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                marriage_file.save(file_path)
                uploaded_files["marriage_certificate"] = filename
            else:
                flash("Invalid file type for marriage certificate. Please upload PDF, JPG, PNG, DOC, or DOCX files.", "error")
                return redirect(url_for("student_requirements.upload_requirements"))
        elif marital_status == "married" and (not marriage_file or not marriage_file.filename):
            flash("Please upload your marriage certificate since you indicated you are married.", "error")
            return redirect(url_for("student_requirements.upload_requirements"))
        else:
            # If not married or marital status not specified, set marriage_certificate to NULL
            uploaded_files["marriage_certificate"] = None

        # Check if any required files are missing
        if missing_required:
            flash(f"Please upload all required documents: {', '.join(missing_required)}", "error")
            return redirect(url_for("student_requirements.upload_requirements"))

        additional_notes = request.form.get("additional_notes", "")

        try:
            # Prepare data for database insertion
            db_data = {
                "user_id": user_id,
                "additional_notes": additional_notes,
                "marital_status": marital_status
            }
            
            # Add file fields to db_data
            for field in required_fields + optional_fields:
                db_data[field] = uploaded_files.get(field)

            cursor.execute(
                """
                INSERT INTO student_requirements
                (user_id, birth_certificate, educational_credentials, id_photos,
                 barangay_clearance, medical_certificate, marriage_certificate, valid_id,
                 transcript_form, good_moral_certificate, brown_envelope, additional_notes)
                VALUES (%(user_id)s, %(birth_certificate)s, %(educational_credentials)s, %(id_photos)s,
                        %(barangay_clearance)s, %(medical_certificate)s, %(marriage_certificate)s, %(valid_id)s,
                        %(transcript_form)s, %(good_moral_certificate)s, %(brown_envelope)s, %(additional_notes)s)
                ON DUPLICATE KEY UPDATE
                 birth_certificate = VALUES(birth_certificate),
                 educational_credentials = VALUES(educational_credentials),
                 id_photos = VALUES(id_photos),
                 barangay_clearance = VALUES(barangay_clearance),
                 medical_certificate = VALUES(medical_certificate),
                 marriage_certificate = VALUES(marriage_certificate),
                 valid_id = VALUES(valid_id),
                 transcript_form = VALUES(transcript_form),
                 good_moral_certificate = VALUES(good_moral_certificate),
                 brown_envelope = VALUES(brown_envelope),
                 additional_notes = VALUES(additional_notes),
                 date_uploaded = NOW()
                """,
                db_data,
            )

            cursor.execute(
                """
                UPDATE login 
                SET verified = 'pending'
                WHERE user_id = %s AND role = 'student'
                """,
                (user_id,),
            )

            db.commit()
            flash("Your TESDA enrollment requirements have been uploaded successfully and are now pending verification.", "success")
            
        except Exception as e:
            db.rollback()
            flash("An error occurred while uploading your requirements. Please try again.", "error")
            print(f"Error uploading requirements: {str(e)}")

        return redirect(url_for("student_requirements.upload_requirements"))

    cursor.execute("SELECT * FROM student_requirements WHERE user_id = %s", (user_id,))
    existing = cursor.fetchone()

    cursor.close()

    return render_template(
        "students/student_requirements.html",
        existing=existing,
        profile_picture=profile_picture
    )