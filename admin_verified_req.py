from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash, send_from_directory
from database import get_db
import os
import math
import traceback

admin_verified_req_bp = Blueprint("admin_verified_req", __name__, url_prefix="/admin/verify")

UPLOAD_FOLDER = os.path.join("static", "uploads", "requirements")
PROFILE_PICTURE_FOLDER = os.path.join("static", "uploads", "profile_pictures")

# Only include fields that students actually upload
DOCUMENT_TYPES = {
    'barangay_clearance': 'Barangay Clearance',
    'medical_certificate': 'Medical Certificate',
    'valid_id': 'Valid ID',
    'transcript_form': 'Transcript Form',
    'marriage_certificate': 'Marriage Certificate'
}

# -----------------------------
# MAIN PAGE
# -----------------------------
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


# -----------------------------
# STATISTICS (SAFE)
# -----------------------------
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
            AND (verified IS NULL OR verified!='verified')
        """)
        pending = cursor.fetchone()["pending"]

        return {"total": total, "verified": verified, "pending": pending}
    except Exception as e:
        print(f"Error getting statistics: {e}")
        return {"total": 0, "verified": 0, "pending": 0}
    finally:
        cursor.close()


# -----------------------------
# GET STATISTICS ENDPOINT
# -----------------------------
@admin_verified_req_bp.route("/stats", methods=["GET"])
def get_stats():
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify(get_statistics())


# -----------------------------
# FETCH DATA (SAFE)
# -----------------------------
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

        # Build address field by concatenating individual address components
        # Based on your schema: province, municipality, baranggay
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
            query += " AND (l.verified IS NULL OR l.verified!='verified')"

        query += " ORDER BY COALESCE(sr.date_uploaded, '1970-01-01') DESC LIMIT %s OFFSET %s"
        params += [per_page, offset]

        cursor.execute(query, params)
        students = cursor.fetchall()
        
        # Ensure all students have user_id field
        for student in students:
            if student['user_id'] is None:
                # Handle case where student hasn't uploaded requirements yet
                student['document_count'] = 0
            else:
                # Count uploaded documents
                count = 0
                for field in DOCUMENT_TYPES.keys():
                    if student.get(field):
                        count += 1
                student['document_count'] = count

        cursor.execute("""
            SELECT COUNT(*) total
            FROM login l
            WHERE l.role='student' AND l.account_status='active'
        """)
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


# -----------------------------
# FILE PREVIEW ENDPOINT
# -----------------------------
@admin_verified_req_bp.route("/file/<filename>", methods=["GET"])
def get_file(filename):
    """Serve uploaded requirement files"""
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Get the file path
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        
        # Return file URL
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


# -----------------------------
# GET DOCUMENT INFORMATION
# -----------------------------
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


# -----------------------------
# STUDENT DETAILS
# -----------------------------
@admin_verified_req_bp.route("/student_details/<int:user_id>", methods=["GET"])
def get_student_details(user_id):
    if session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Get student basic info with concatenated address
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

        # Calculate document count based on ACTUAL uploaded documents
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


# -----------------------------
# ACCEPT VERIFICATION
# -----------------------------
@admin_verified_req_bp.route("/accept/<int:user_id>", methods=["POST"])
def accept_verification(user_id):
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor()

    try:
        # First check if student exists
        cursor.execute("""
            SELECT user_id FROM login 
            WHERE user_id=%s AND role='student' AND account_status='active'
        """, (user_id,))
        
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Student not found"}), 404
        
        # Update verification status
        cursor.execute("""
            UPDATE login SET verified='verified'
            WHERE user_id=%s AND role='student'
        """, (user_id,))
        db.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.rollback()
        print(f"Error in accept_verification: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()