from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, send_from_directory, current_app
from database import get_db
import os
import math
import traceback

admin_verified_req_bp = Blueprint("admin_verified_req", __name__, url_prefix="/admin/verify")

UPLOAD_FOLDER = os.path.join("static", "uploads", "requirements")
PROFILE_PICTURE_FOLDER = os.path.join("static", "uploads", "profile_pictures")
 
DOCUMENT_TYPES = {
    'barangay_clearance': 'Barangay Clearance',
    'medical_certificate': 'Medical Certificate',
    'valid_id': 'Valid ID',
    'transcript_form': 'Transcript Form',
    'marriage_certificate': 'Marriage Certificate'
} 
def send_verification_email(email, username, student_name):
    """Send email notification when verification is approved"""
    try:
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not found")
            return False
            
        msg = Message(
            subject="LSEF TESDA - Document Verification Approved",
            sender=("LSEF TESDA", current_app.config['MAIL_USERNAME']), 
            recipients=[email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0056b3; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">LSEF TESDA</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #0056b3;">Document Verification Approved</h2>
                    <p>Dear {student_name},</p>
                    
                    <p>We are pleased to inform you that your submitted documents have been <strong>successfully verified</strong> by our administration team at <strong>LSEF TESDA</strong>.</p>
                    
                    <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0056b3; margin: 15px 0;">
                        <p style="margin: 0; font-weight: bold;">✅ All requirements have been approved</p>
                        <p style="margin: 5px 0 0 0;">You can now proceed to enroll in courses and access all student features.</p>
                    </div>
                    
                    <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
                    
                    <p>Thank you for your patience during the verification process.</p>
                    
                    <p>Best regards,</p>
                    <p><strong>LSEF TESDA Administration Team</strong></p>
                </div>
                
                <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
            """
        )
        mail.send(msg)
        current_app.logger.info(f"Verification approval email sent successfully to {email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending verification approval email to {email}: {str(e)}")
        return False

def send_rejection_email(email, username, student_name, rejection_reason):
    """Send email notification when verification is rejected with reason"""
    try:
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not found")
            return False
            
        msg = Message(
            subject="LSEF TESDA - Document Verification Update",
            sender=("LSEF TESDA", current_app.config['MAIL_USERNAME']), 
            recipients=[email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0056b3; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">LSEF TESDA</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #0056b3;">Document Verification Update</h2>
                    <p>Dear {student_name},</p>
                    
                    <p>We regret to inform you that your submitted documents <strong>require further attention</strong>.</p>
                    
                    <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #b30000; margin: 15px 0;">
                        <p style="margin: 0; font-weight: bold;">⚠️ Verification Status: <span style="color: #b30000;">Rejected</span></p>
                        <p style="margin: 5px 0 0 0; font-weight: bold;">Reason for Rejection:</p>
                        <p style="margin: 5px 0 0 0; padding: 10px; background-color: #fff5f5; border-radius: 4px;">
                            {rejection_reason}
                        </p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul style="margin: 10px 0 20px 20px; padding: 0;">
                        <li>Review the rejection reason above</li>
                        <li>Correct the issues with your submitted documents</li>
                        <li>Resubmit your documents through your student portal</li>
                        <li>Contact support if you need clarification</li>
                    </ul>
                    
                    <p>Please note that you cannot enroll in courses until your documents are verified.</p>
                    
                    <p>If you have any questions about the rejection reason, please contact our support team for assistance.</p>
                    
                    <p>Sincerely,</p>
                    <p><strong>LSEF TESDA Administration Team</strong></p>
                </div>
                
                <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
            """
        )
        mail.send(msg)
        current_app.logger.info(f"Verification rejection email sent successfully to {email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending verification rejection email to {email}: {str(e)}")
        return False
 
from flask_mail import Message
 
@admin_verified_req_bp.route("/", methods=["GET"])
def view_requirements():
    if "user_id" not in session or session.get("role") != "admin":
        flash("Unauthorized access. Admin only.", "error")
        return redirect(url_for("auth.login"))

    db = get_db()
    cursor = db.cursor(buffered=True)

    try:
        cursor.execute("""
            SELECT profile_picture 
            FROM personal_information 
            WHERE user_id = %s
        """, (session["user_id"],))
        row = cursor.fetchone()
        profile_picture = row[0] if row else None
    finally:
        cursor.close()

    return render_template("admin/admin_verified_req.html", profile_picture=profile_picture)
 
def get_statistics():
    db = get_db()
    cursor = db.cursor(dictionary=True, buffered=True)

    try:
        cursor.execute("""
            SELECT COUNT(*) total 
            FROM login 
            WHERE role='student' AND account_status='active'
        """)
        total = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) verified 
            FROM login 
            WHERE role='student' AND account_status='active' AND verified='verified'
        """)
        verified = cursor.fetchone()["verified"]

        cursor.execute("""
            SELECT COUNT(*) pending 
            FROM login 
            WHERE role='student' AND account_status='active'
            AND (verified='pending' OR verified IS NULL)
        """)
        pending = cursor.fetchone()["pending"]

        cursor.execute("""
            SELECT COUNT(*) rejected 
            FROM login 
            WHERE role='student' AND account_status='active' AND verified='rejected'
        """)
        rejected = cursor.fetchone()["rejected"]

        return {
            "total": total, 
            "verified": verified, 
            "pending": pending,
            "rejected": rejected
        }
    except Exception as e:
        print(f"Error getting statistics: {e}")
        return {"total": 0, "verified": 0, "pending": 0, "rejected": 0}
    finally:
        cursor.close()

 
@admin_verified_req_bp.route("/stats", methods=["GET"])
def get_stats():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify(get_statistics())

 
@admin_verified_req_bp.route("/data", methods=["GET"])
def fetch_data():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        search = request.args.get("search", "").strip()
        status = request.args.get("status", "")
        page = int(request.args.get("page", 1))
        per_page = 10
        offset = (page - 1) * per_page
 
        query = """
            SELECT 
                sr.user_id,
                sr.barangay_clearance,
                sr.valid_id,
                sr.medical_certificate,
                sr.transcript_form,
                sr.marriage_certificate,
                sr.additional_notes,
                sr.date_uploaded,
                l.username, 
                l.email, 
                l.verified,
                pi.first_name, 
                pi.middle_name, 
                pi.last_name, 
                pi.profile_picture,
                pi.province,
                pi.municipality,
                pi.baranggay,
                pi.contact_number,
                pi.date_of_birth,
                pi.gender,
                CONCAT(COALESCE(pi.first_name, ''), ' ', COALESCE(pi.last_name, '')) as full_name,
                CONCAT(
                    COALESCE(pi.baranggay, ''), 
                    ', ', 
                    COALESCE(pi.municipality, ''), 
                    ', ', 
                    COALESCE(pi.province, '')
                ) as full_address
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_requirements sr ON l.user_id = sr.user_id
            WHERE l.role='student' AND l.account_status='active'
        """

        params = []
        search_pattern = f"%{search}%"

        if search:
            query += " AND (pi.first_name LIKE %s OR pi.last_name LIKE %s OR l.email LIKE %s OR l.username LIKE %s)"
            params += [search_pattern, search_pattern, search_pattern, search_pattern]
 
        if status == "verified":
            query += " AND l.verified='verified'"
        elif status == "pending":
            query += " AND (l.verified='pending' OR l.verified IS NULL)"
        elif status == "rejected":
            query += " AND l.verified='rejected'"

        query += " ORDER BY COALESCE(sr.date_uploaded, '1970-01-01') DESC LIMIT %s OFFSET %s"
        params += [per_page, offset]

        cursor.execute(query, params)
        students = cursor.fetchall()
         
        for student in students:
            if student['user_id'] is None: 
                student['document_count'] = 0
            else: 
                count = 0
                for field in DOCUMENT_TYPES.keys():
                    if student.get(field):
                        count += 1
                student['document_count'] = count
 
        count_query = """
            SELECT COUNT(*) total
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.role='student' AND l.account_status='active'
        """
        count_params = []
        
        if search:
            count_query += " AND (pi.first_name LIKE %s OR pi.last_name LIKE %s OR l.email LIKE %s OR l.username LIKE %s)"
            count_params += [search_pattern, search_pattern, search_pattern, search_pattern]
        
        if status == "verified":
            count_query += " AND l.verified='verified'"
        elif status == "pending":
            count_query += " AND (l.verified='pending' OR l.verified IS NULL)"
        elif status == "rejected":
            count_query += " AND l.verified='rejected'"
        
        cursor.execute(count_query, count_params)
        total_records = cursor.fetchone()["total"]

        return jsonify({
            "students": students,
            "total_pages": math.ceil(total_records / per_page),
            "current_page": page,
            "stats": get_statistics()
        })
    except Exception as e:
        print(f"Error in fetch_data: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

 
@admin_verified_req_bp.route("/file/<filename>", methods=["GET"])
def get_file(filename):
    """Serve uploaded requirement files"""
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    try: 
        file_path = os.path.join(UPLOAD_FOLDER, filename)
         
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
         
        file_url = url_for('static', filename=f'uploads/requirements/{filename}')
        return jsonify({
            "success": True,
            "file_url": file_url,
            "filename": filename
        })
    except Exception as e:
        print(f"Error in get_file: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
 
@admin_verified_req_bp.route("/document_info/<int:user_id>/<field_name>", methods=["GET"])
def get_document_info(user_id, field_name):
    """Get information about a specific document field"""
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    document_name = DOCUMENT_TYPES.get(field_name, field_name.replace('_', ' ').title())
    
    return jsonify({
        "document_type": document_name,
        "field_name": field_name,
        "user_id": user_id
    })

 
@admin_verified_req_bp.route("/student_details/<int:user_id>", methods=["GET"])
def get_student_details(user_id):
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try: 
        cursor.execute("""
            SELECT 
                l.user_id,
                l.username,
                l.email,
                l.verified,
                l.account_status,
                pi.first_name,
                pi.middle_name,
                pi.last_name,
                pi.gender,
                pi.date_of_birth,
                pi.contact_number,
                pi.province,
                pi.municipality,
                pi.baranggay,
                pi.profile_picture,
                sr.barangay_clearance,
                sr.valid_id,
                sr.medical_certificate,
                sr.transcript_form,
                sr.marriage_certificate,
                sr.additional_notes,
                sr.date_uploaded,
                CONCAT(COALESCE(pi.first_name, ''), ' ', COALESCE(pi.last_name, '')) as full_name,
                CONCAT(
                    COALESCE(pi.baranggay, ''), 
                    ', ', 
                    COALESCE(pi.municipality, ''), 
                    ', ', 
                    COALESCE(pi.province, '')
                ) as full_address
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_requirements sr ON l.user_id = sr.user_id
            WHERE l.user_id = %s AND l.role = 'student'
        """, (user_id,))

        student = cursor.fetchone()
        if not student:
            return jsonify({"error": "Student not found"}), 404
 
        document_count = 0
        for field in DOCUMENT_TYPES.keys():
            if student.get(field):
                document_count += 1
        
        student["document_count"] = document_count
        student["profile_picture"] = student.get("profile_picture") or "default.png"

        return jsonify({"success": True, "student": student})
    except Exception as e:
        print(f"Error in get_student_details: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
 
@admin_verified_req_bp.route("/accept/<int:user_id>", methods=["POST"])
def accept_verification(user_id):
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try: 
        db.start_transaction()
         
        cursor.execute("""
            SELECT l.username, l.email, l.verified, pi.first_name, pi.last_name
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id=%s AND l.role='student' AND l.account_status='active'
        """, (user_id,))
        
        student_info = cursor.fetchone()
        if not student_info:
            db.rollback()
            return jsonify({"success": False, "message": "Student not found"}), 404
         
        student_name = f"{student_info['first_name']} {student_info['last_name']}"
        email_sent = send_verification_email(
            student_info['email'], 
            student_info['username'], 
            student_name
        )
        
        if not email_sent:
            db.rollback()
            current_app.logger.error(f"Failed to send verification email for student {user_id}")
            return jsonify({
                "success": False, 
                "message": "Failed to send approval email. Verification not completed.",
                "email_sent": False
            }), 500 
        cursor.execute("""
            UPDATE login SET verified='verified'
            WHERE user_id=%s AND role='student'
        """, (user_id,))
        
        db.commit()
        return jsonify({
            "success": True,
            "message": "Student verified successfully and notification email sent",
            "email_sent": True
        })
    except Exception as e:
        db.rollback()
        print(f"Error in accept_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

 
@admin_verified_req_bp.route("/reject/<int:user_id>", methods=["POST"])
def reject_verification(user_id):
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    rejection_reason = data.get('rejection_reason', '').strip() if data else ''
    
    if not rejection_reason:
        return jsonify({
            "success": False, 
            "message": "Rejection reason is required"
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try: 
        db.start_transaction()
         
        cursor.execute("""
            SELECT l.username, l.email, l.verified, pi.first_name, pi.last_name
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id=%s AND l.role='student' AND l.account_status='active'
        """, (user_id,))
        
        student_info = cursor.fetchone()
        if not student_info:
            db.rollback()
            return jsonify({"success": False, "message": "Student not found"}), 404
         
        student_name = f"{student_info['first_name']} {student_info['last_name']}"
        email_sent = send_rejection_email(
            student_info['email'], 
            student_info['username'], 
            student_name,
            rejection_reason
        )
        
        if not email_sent:
            db.rollback()
            current_app.logger.error(f"Failed to send rejection email for student {user_id}")
            return jsonify({
                "success": False, 
                "message": "Failed to send rejection email. Verification status not updated.",
                "email_sent": False
            }), 500
 
        cursor.execute("""
            UPDATE login SET verified='rejected'
            WHERE user_id=%s AND role='student'
        """, (user_id,))
        
        db.commit()
        return jsonify({
            "success": True,
            "message": "Verification rejected successfully and notification email sent",
            "email_sent": True
        })
    except Exception as e:
        db.rollback()
        print(f"Error in reject_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

 
@admin_verified_req_bp.route("/reopen/<int:user_id>", methods=["POST"])
def reopen_verification(user_id):
    """Change status from 'rejected' back to 'pending' to allow resubmission"""
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor()

    try: 
        cursor.execute("""
            SELECT user_id, verified FROM login 
            WHERE user_id=%s AND role='student' AND account_status='active'
        """, (user_id,))
        
        student = cursor.fetchone()
        if not student:
            return jsonify({"success": False, "message": "Student not found"}), 404
        
        if student[1] != 'rejected':
            return jsonify({"success": False, "message": "Student is not in rejected status"}), 400
         
        cursor.execute("""
            UPDATE login SET verified='pending'
            WHERE user_id=%s AND role='student'
        """, (user_id,))
        
        db.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.rollback()
        print(f"Error in reopen_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()