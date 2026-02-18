from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, current_app
from database import get_db
import os
import math
import traceback

admin_staff_verified_req_bp = Blueprint("admin_staff_verified_req", __name__, url_prefix="/admin/staff-verify")

UPLOAD_FOLDER = os.path.join("static", "uploads", "signatures")
PROFILE_PICTURE_FOLDER = os.path.join("static", "uploads", "profile_pictures")

def send_staff_verification_email(email, username, staff_name):
    """Send email notification when staff verification is approved"""
    try:
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not found")
            return False
            
        msg = Message(
            subject="LSEF TESDA - Staff Account Verification Approved",
            sender=("LSEF TESDA", current_app.config['MAIL_USERNAME']), 
            recipients=[email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0056b3; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">LSEF TESDA</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #0056b3;">Staff Account Verification Approved</h2>
                    <p>Dear {staff_name},</p>
                    
                    <p>We are pleased to inform you that your staff account has been <strong>successfully verified</strong> by our administration team at <strong>LSEF TESDA</strong>.</p>
                    
                    <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0056b3; margin: 15px 0;">
                        <p style="margin: 0; font-weight: bold;">✅ Your e-signature has been approved</p>
                        <p style="margin: 5px 0 0 0;">You can now access all staff features and manage classes.</p>
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
        current_app.logger.info(f"Staff verification approval email sent successfully to {email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending staff verification approval email to {email}: {str(e)}")
        return False

def send_staff_rejection_email(email, username, staff_name, rejection_reason):
    """Send email notification when staff verification is rejected with reason"""
    try:
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not found")
            return False
            
        msg = Message(
            subject="LSEF TESDA - Staff Account Verification Update",
            sender=("LSEF TESDA", current_app.config['MAIL_USERNAME']), 
            recipients=[email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0056b3; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">LSEF TESDA</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #0056b3;">Staff Account Verification Update</h2>
                    <p>Dear {staff_name},</p>
                    
                    <p>We regret to inform you that your staff account verification <strong>requires further attention</strong>.</p>
                    
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
                        <li>Upload a new e-signature through your staff portal</li>
                        <li>Contact support if you need clarification</li>
                    </ul>
                    
                    <p>Please note that you cannot access staff features until your e-signature is verified.</p>
                    
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
        current_app.logger.info(f"Staff verification rejection email sent successfully to {email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending staff verification rejection email to {email}: {str(e)}")
        return False

from flask_mail import Message

@admin_staff_verified_req_bp.route("/", methods=["GET"])
def view_staff_requirements():
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

    return render_template("admin/admin_staff_verified_req.html", profile_picture=profile_picture)

def get_staff_statistics():
    db = get_db()
    cursor = db.cursor(dictionary=True, buffered=True)

    try:
        cursor.execute("""
            SELECT COUNT(*) total 
            FROM login 
            WHERE role='staff' AND account_status='active'
        """)
        total = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) verified 
            FROM login 
            WHERE role='staff' AND account_status='active' AND verified='verified'
        """)
        verified = cursor.fetchone()["verified"]

        cursor.execute("""
            SELECT COUNT(*) pending 
            FROM login 
            WHERE role='staff' AND account_status='active'
            AND (verified='pending' OR verified IS NULL)
        """)
        pending = cursor.fetchone()["pending"]

        cursor.execute("""
            SELECT COUNT(*) rejected 
            FROM login 
            WHERE role='staff' AND account_status='active' AND verified='rejected'
        """)
        rejected = cursor.fetchone()["rejected"]

        return {
            "total": total, 
            "verified": verified, 
            "pending": pending,
            "rejected": rejected
        }
    except Exception as e:
        print(f"Error getting staff statistics: {e}")
        return {"total": 0, "verified": 0, "pending": 0, "rejected": 0}
    finally:
        cursor.close()

@admin_staff_verified_req_bp.route("/stats", methods=["GET"])
def get_stats():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify(get_staff_statistics())

@admin_staff_verified_req_bp.route("/data", methods=["GET"])
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

        # Query for staff with e-signature information
        query = """
            SELECT 
                l.user_id,
                l.username, 
                l.email, 
                l.verified,
                pi.first_name, 
                pi.middle_name, 
                pi.last_name, 
                pi.profile_picture,
                pi.signature as e_signature,
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
                ) as full_address,
                CASE 
                    WHEN pi.signature IS NOT NULL AND pi.signature != '' THEN 1 
                    ELSE 0 
                END as has_signature
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.role='staff' AND l.account_status='active'
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

        query += " ORDER BY l.user_id DESC LIMIT %s OFFSET %s"
        params += [per_page, offset]

        cursor.execute(query, params)
        staff_members = cursor.fetchall()
        
        # Count query for pagination
        count_query = """
            SELECT COUNT(*) total
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.role='staff' AND l.account_status='active'
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
            "staff": staff_members,
            "total_pages": math.ceil(total_records / per_page),
            "current_page": page,
            "stats": get_staff_statistics()
        })
    except Exception as e:
        print(f"Error in fetch_data: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@admin_staff_verified_req_bp.route("/signature/<filename>", methods=["GET"])
def get_signature(filename):
    """Serve uploaded signature files"""
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Signature file not found"}), 404
        
        file_url = url_for('static', filename=f'uploads/signatures/{filename}')
        return jsonify({
            "success": True,
            "file_url": file_url,
            "filename": filename
        })
    except Exception as e:
        print(f"Error in get_signature: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@admin_staff_verified_req_bp.route("/staff_details/<int:user_id>", methods=["GET"])
def get_staff_details(user_id):
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
                pi.signature as e_signature,
                pi.date_registered,
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
            WHERE l.user_id = %s AND l.role = 'staff'
        """, (user_id,))

        staff = cursor.fetchone()
        if not staff:
            return jsonify({"error": "Staff member not found"}), 404

        staff["has_signature"] = 1 if staff.get("e_signature") else 0
        staff["profile_picture"] = staff.get("profile_picture") or "default.png"

        return jsonify({"success": True, "staff": staff})
    except Exception as e:
        print(f"Error in get_staff_details: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@admin_staff_verified_req_bp.route("/accept/<int:user_id>", methods=["POST"])
def accept_verification(user_id):
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        db.start_transaction()
        
        cursor.execute("""
            SELECT l.username, l.email, l.verified, pi.first_name, pi.last_name, pi.signature
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id=%s AND l.role='staff' AND l.account_status='active'
        """, (user_id,))
        
        staff_info = cursor.fetchone()
        if not staff_info:
            db.rollback()
            return jsonify({"success": False, "message": "Staff member not found"}), 404
        
        # Check if signature exists
        if not staff_info.get('signature'):
            db.rollback()
            return jsonify({
                "success": False, 
                "message": "Staff member has not uploaded an e-signature yet"
            }), 400
        
        staff_name = f"{staff_info['first_name']} {staff_info['last_name']}"
        email_sent = send_staff_verification_email(
            staff_info['email'], 
            staff_info['username'], 
            staff_name
        )
        
        if not email_sent:
            db.rollback()
            current_app.logger.error(f"Failed to send staff verification email for user {user_id}")
            return jsonify({
                "success": False, 
                "message": "Failed to send approval email. Verification not completed.",
                "email_sent": False
            }), 500
        
        cursor.execute("""
            UPDATE login SET verified='verified'
            WHERE user_id=%s AND role='staff'
        """, (user_id,))
        
        db.commit()
        return jsonify({
            "success": True,
            "message": "Staff member verified successfully and notification email sent",
            "email_sent": True
        })
    except Exception as e:
        db.rollback()
        print(f"Error in accept_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

@admin_staff_verified_req_bp.route("/reject/<int:user_id>", methods=["POST"])
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
            WHERE l.user_id=%s AND l.role='staff' AND l.account_status='active'
        """, (user_id,))
        
        staff_info = cursor.fetchone()
        if not staff_info:
            db.rollback()
            return jsonify({"success": False, "message": "Staff member not found"}), 404
        
        staff_name = f"{staff_info['first_name']} {staff_info['last_name']}"
        email_sent = send_staff_rejection_email(
            staff_info['email'], 
            staff_info['username'], 
            staff_name,
            rejection_reason
        )
        
        if not email_sent:
            db.rollback()
            current_app.logger.error(f"Failed to send staff rejection email for user {user_id}")
            return jsonify({
                "success": False, 
                "message": "Failed to send rejection email. Verification status not updated.",
                "email_sent": False
            }), 500

        cursor.execute("""
            UPDATE login SET verified='rejected'
            WHERE user_id=%s AND role='staff'
        """, (user_id,))
        
        db.commit()
        return jsonify({
            "success": True,
            "message": "Staff verification rejected successfully and notification email sent",
            "email_sent": True
        })
    except Exception as e:
        db.rollback()
        print(f"Error in reject_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

@admin_staff_verified_req_bp.route("/reopen/<int:user_id>", methods=["POST"])
def reopen_verification(user_id):
    """Change status from 'rejected' back to 'pending' to allow resubmission"""
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT user_id, verified FROM login 
            WHERE user_id=%s AND role='staff' AND account_status='active'
        """, (user_id,))
        
        staff = cursor.fetchone()
        if not staff:
            return jsonify({"success": False, "message": "Staff member not found"}), 404
        
        if staff[1] != 'rejected':
            return jsonify({"success": False, "message": "Staff member is not in rejected status"}), 400
        
        cursor.execute("""
            UPDATE login SET verified='pending'
            WHERE user_id=%s AND role='staff'
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