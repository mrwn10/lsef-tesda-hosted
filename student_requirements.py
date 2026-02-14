from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from database import get_db
import os
from werkzeug.utils import secure_filename
import traceback

student_requirements_bp = Blueprint("student_requirements", __name__)

UPLOAD_FOLDER = os.path.join("static", "uploads", "requirements")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@student_requirements_bp.route("/student/requirements", methods=["GET"])
def upload_requirements():
    if "user_id" not in session or session.get("role") != "student":
        flash("Unauthorized access. Please login as student.", "error")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(dictionary=True, buffered=True)
    user_id = session["user_id"]
 
    profile_picture = "default.png"
    gender = None
    verified_status = None

    cursor.execute("""
        SELECT profile_picture, gender
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()

    if user:
        profile_picture = user.get("profile_picture") or profile_picture
        gender = (user.get("gender") or "").lower()
 
    cursor.execute("""
        SELECT verified FROM login
        WHERE user_id = %s
    """, (user_id,))
    login_info = cursor.fetchone()
    if login_info:
        verified_status = login_info.get("verified")
 
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
        verified_status=verified_status
    )

@student_requirements_bp.route("/student/requirements/submit", methods=["POST"])
def submit_requirements():
    if "user_id" not in session or session.get("role") != "student":
        return jsonify({"status": "error", "message": "Unauthorized access"}), 401

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True, buffered=True)
        user_id = session["user_id"]
         
        cursor.execute("""
            SELECT verified FROM login
            WHERE user_id = %s AND role = 'student'
        """, (user_id,))
        login_info = cursor.fetchone()
        
        current_status = login_info.get("verified") if login_info else None
         
        if current_status == 'verified':
            return jsonify({
                "status": "error",
                "message": "Your requirements have already been verified and approved. No further submissions are allowed.",
                "verified_status": "verified"
            }), 403
         
        cursor.execute("""
            SELECT gender FROM personal_information
            WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        gender = (user.get("gender") or "").lower() if user else ""
         
        previous_status = current_status
        
        uploaded_files = {}
        errors = []

        required_fields = [
            "valid_id",
            "medical_certificate",
            "transcript_form",
        ]

        optional_fields = [
            "barangay_clearance",
        ] 
        marital_status = request.form.get("marital_status", "")
        if not marital_status:
            return jsonify({
                "status": "error", 
                "message": "Please select your marital status"
            }), 400
 
        for field in required_fields:
            file = request.files.get(field)
            if not file or not file.filename:
                errors.append(field.replace("_", " ").title())
            elif allowed_file(file.filename): 
                file.seek(0, os.SEEK_END)
                file_length = file.tell()
                file.seek(0)
                
                if file_length > 10 * 1024 * 1024:  
                    return jsonify({
                        "status": "error",
                        "message": f"File too large for {field.replace('_', ' ')}. Maximum size is 10MB."
                    }), 400
                
                filename = secure_filename(f"{user_id}_{field}_{file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                uploaded_files[field] = filename
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid file type for {field.replace('_', ' ')}. Allowed types: PDF, JPG, PNG, DOC, DOCX"
                }), 400

        if errors:
            return jsonify({
                "status": "error",
                "message": f"Please upload all required documents: {', '.join(errors)}"
            }), 400
 
        for field in optional_fields:
            file = request.files.get(field)
            if file and file.filename:
                if allowed_file(file.filename): 
                    file.seek(0, os.SEEK_END)
                    file_length = file.tell()
                    file.seek(0)
                    
                    if file_length > 10 * 1024 * 1024:
                        return jsonify({
                            "status": "error",
                            "message": f"File too large for {field.replace('_', ' ')}. Maximum size is 10MB."
                        }), 400
                    
                    filename = secure_filename(f"{user_id}_{field}_{file.filename}")
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    uploaded_files[field] = filename
                else:
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid file type for {field.replace('_', ' ')}"
                    }), 400
            else:
                uploaded_files[field] = None
 
        marriage_file = request.files.get("marriage_certificate")
        if gender == "female" and marital_status == "married":
            if marriage_file and marriage_file.filename:
                if not allowed_file(marriage_file.filename):
                    return jsonify({
                        "status": "error",
                        "message": "Invalid file type for marriage certificate."
                    }), 400
                 
                marriage_file.seek(0, os.SEEK_END)
                file_length = marriage_file.tell()
                marriage_file.seek(0)
                
                if file_length > 10 * 1024 * 1024:
                    return jsonify({
                        "status": "error",
                        "message": "Marriage certificate file too large. Maximum size is 10MB."
                    }), 400
                
                filename = secure_filename(
                    f"{user_id}_marriage_certificate_{marriage_file.filename}"
                )
                marriage_file.save(os.path.join(UPLOAD_FOLDER, filename))
                uploaded_files["marriage_certificate"] = filename
            else:
                return jsonify({
                    "status": "error",
                    "message": "Marriage certificate is required for married female applicants."
                }), 400
        else:
            uploaded_files["marriage_certificate"] = None

        additional_notes = request.form.get("additional_notes", "")
 
        cursor.execute("SELECT requirement_id FROM student_requirements WHERE user_id = %s", (user_id,))
        existing_record = cursor.fetchone()
        
        if existing_record: 
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
            is_resubmission = previous_status == 'rejected'
        else: 
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
            is_resubmission = False
 
        cursor.execute("""
            UPDATE login
            SET verified = 'pending'
            WHERE user_id = %s AND role = 'student'
        """, (user_id,))

        db.commit()
        cursor.close()
        
        if is_resubmission:
            return jsonify({
                "status": "success",
                "message": "Your requirements have been resubmitted successfully and are pending verification!",
                "verified_status": "pending",
                "is_resubmission": True
            })
        else:
            return jsonify({
                "status": "success",
                "message": f"Your TESDA requirements have been {action_message} successfully and are pending verification!",
                "verified_status": "pending",
                "is_resubmission": False
            })

    except Exception as e:
        print("Upload error:", e)
        print(traceback.format_exc())
        if db:
            db.rollback()
        return jsonify({
            "status": "error",
            "message": "An error occurred while uploading your requirements. Please try again."
        }), 500