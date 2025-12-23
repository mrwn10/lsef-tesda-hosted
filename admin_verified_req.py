from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from database import get_db
import os
import math

admin_verified_req_bp = Blueprint("admin_verified_req", __name__, url_prefix="/admin/verify")

UPLOAD_FOLDER = os.path.join("static", "uploads", "requirements")
PROFILE_PICTURE_FOLDER = os.path.join("static", "uploads", "profile_pictures")

# Document type mapping for display names
DOCUMENT_TYPES = {
    'birth_certificate': 'Birth Certificate',
    'educational_credentials': 'Educational Credentials',
    'id_photos': 'ID Photos',
    'barangay_clearance': 'Barangay Clearance',
    'medical_certificate': 'Medical Certificate',
    'marriage_certificate': 'Marriage Certificate',
    'valid_id': 'Valid ID',
    'transcript_form': 'Transcript Form',
    'good_moral_certificate': 'Good Moral Certificate',
    'brown_envelope': 'Brown Envelope'
}

# -----------------------------
# MAIN PAGE (Loads Template)
# -----------------------------
@admin_verified_req_bp.route("/", methods=["GET"])
def view_requirements():
    if "user_id" not in session or session.get("role") != "admin":
        flash("Unauthorized access. Admin only.", "error")
        return redirect(url_for("auth.login"))

    # Get admin profile picture for the template
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT pi.profile_picture
            FROM personal_information pi
            WHERE pi.user_id = %s
        """, (session['user_id'],))
        result = cursor.fetchone()
        profile_picture = result[0] if result else None
    except Exception as e:
        profile_picture = None
    finally:
        cursor.close()

    return render_template(
        "admin/admin_verified_req.html",
        profile_picture=profile_picture
    )


# -----------------------------
# GET STATISTICS (UPDATED WITH PROPER FILTERS)
# -----------------------------
def get_statistics():
    """Get statistics for verified, pending, and total students with proper filters"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Total active students (role = student AND account_status = active)
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM login 
            WHERE role = 'student' AND account_status = 'active'
        """)
        total_result = cursor.fetchone()
        total = total_result['total'] if total_result else 0
        
        # Verified students (role = student AND account_status = active AND verified = 'verified')
        cursor.execute("""
            SELECT COUNT(*) as verified 
            FROM login 
            WHERE role = 'student' 
            AND account_status = 'active' 
            AND verified = 'verified'
        """)
        verified_result = cursor.fetchone()
        verified = verified_result['verified'] if verified_result else 0
        
        # Pending students (role = student AND account_status = active AND (verified IS NULL OR verified != 'verified'))
        cursor.execute("""
            SELECT COUNT(*) as pending 
            FROM login 
            WHERE role = 'student' 
            AND account_status = 'active' 
            AND (verified IS NULL OR verified != 'verified')
        """)
        pending_result = cursor.fetchone()
        pending = pending_result['pending'] if pending_result else 0
        
        print(f"Statistics - Total: {total}, Verified: {verified}, Pending: {pending}")  # Debug log
        
        return {
            'total': total,
            'verified': verified,
            'pending': pending
        }
        
    except Exception as e:
        print(f"Error getting statistics: {e}")
        return {
            'total': 0,
            'verified': 0,
            'pending': 0
        }
    finally:
        cursor.close()


# -----------------------------
# AJAX DATA FETCH (Search + Pagination + Statistics) - UPDATED WITH PROFILE PICTURE
# -----------------------------
@admin_verified_req_bp.route("/data", methods=["GET"])
def fetch_data():
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Parameters
    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "")
    page = int(request.args.get("page", 1))
    per_page = 10
    offset = (page - 1) * per_page

    # Base query - only show active students WITH PROFILE PICTURE
    query = """
        SELECT sr.*, l.username, l.email, l.account_status, l.verified,
               pi.first_name, pi.middle_name, pi.last_name,
               pi.profile_picture,  -- ADDED PROFILE PICTURE
               pi.contact_number, pi.date_of_birth, pi.gender  -- Additional info
        FROM student_requirements sr
        JOIN login l ON sr.user_id = l.user_id
        LEFT JOIN personal_information pi ON sr.user_id = pi.user_id
        WHERE l.role = 'student' AND l.account_status = 'active'
    """
    params = []

    # Filters
    if search_query:
        query += " AND (pi.first_name LIKE %s OR pi.last_name LIKE %s OR l.email LIKE %s)"
        search_pattern = f"%{search_query}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    if status_filter:
        if status_filter == "verified":
            query += " AND l.verified = 'verified'"
        elif status_filter == "pending":
            query += " AND (l.verified IS NULL OR l.verified != 'verified')"

    # Pagination
    query += " ORDER BY sr.date_uploaded DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])

    cursor.execute(query, tuple(params))
    students = cursor.fetchall()

    # Process profile picture paths
    for student in students:
        if student.get('profile_picture'):
            # Ensure consistent profile picture path
            student['profile_picture'] = student['profile_picture']
        else:
            student['profile_picture'] = 'default.png'
        
        # Format full name
        student['full_name'] = f"{student.get('first_name', '')} {student.get('middle_name', '')} {student.get('last_name', '')}".strip()

    # Count total records for pagination
    count_query = """
        SELECT COUNT(*) AS total
        FROM student_requirements sr
        JOIN login l ON sr.user_id = l.user_id
        LEFT JOIN personal_information pi ON sr.user_id = pi.user_id
        WHERE l.role = 'student' AND l.account_status = 'active'
    """
    count_params = []
    
    if search_query:
        count_query += " AND (pi.first_name LIKE %s OR pi.last_name LIKE %s OR l.email LIKE %s)"
        count_params.extend([search_pattern, search_pattern, search_pattern])

    if status_filter:
        if status_filter == "verified":
            count_query += " AND l.verified = 'verified'"
        elif status_filter == "pending":
            count_query += " AND (l.verified IS NULL OR l.verified != 'verified')"

    cursor.execute(count_query, tuple(count_params))
    total_records = cursor.fetchone()["total"]
    total_pages = math.ceil(total_records / per_page)

    # Get statistics
    stats = get_statistics()

    cursor.close()

    return jsonify({
        "students": students,
        "total_pages": total_pages,
        "current_page": page,
        "stats": stats
    })


# -----------------------------
# GET STUDENT DETAILS WITH PROFILE PICTURE - NEW ENDPOINT
# -----------------------------
@admin_verified_req_bp.route("/student_details/<int:user_id>", methods=["GET"])
def get_student_details(user_id):
    """Get complete student details including profile picture"""
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                l.user_id, l.username, l.email, l.account_status, l.verified,
                pi.first_name, pi.middle_name, pi.last_name,
                pi.profile_picture, pi.contact_number, pi.date_of_birth, 
                pi.gender, pi.province, pi.municipality, pi.baranggay,
                sr.birth_certificate, sr.educational_credentials, sr.id_photos,
                sr.barangay_clearance, sr.medical_certificate, sr.marriage_certificate,
                sr.valid_id, sr.transcript_form, sr.good_moral_certificate, sr.brown_envelope,
                sr.date_uploaded
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_requirements sr ON l.user_id = sr.user_id
            WHERE l.user_id = %s AND l.role = 'student' AND l.account_status = 'active'
        """, (user_id,))
        
        student = cursor.fetchone()
        
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Format profile picture path
        if student.get('profile_picture'):
            student['profile_picture'] = student['profile_picture']
        else:
            student['profile_picture'] = 'default.png'
        
        # Format full name and address
        student['full_name'] = f"{student.get('first_name', '')} {student.get('middle_name', '')} {student.get('last_name', '')}".strip()
        student['full_address'] = f"{student.get('baranggay', '')}, {student.get('municipality', '')}, {student.get('province', '')}"
        
        # Format date of birth
        if student.get('date_of_birth'):
            student['date_of_birth'] = student['date_of_birth'].strftime('%Y-%m-%d')
        
        # Count uploaded documents
        document_fields = [
            'birth_certificate', 'educational_credentials', 'id_photos',
            'barangay_clearance', 'medical_certificate', 'marriage_certificate',
            'valid_id', 'transcript_form', 'good_moral_certificate', 'brown_envelope'
        ]
        
        student['document_count'] = sum(1 for field in document_fields if student.get(field))
        
        return jsonify({
            "success": True,
            "student": student
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


# -----------------------------
# GET STATISTICS ENDPOINT (Separate endpoint for stats only)
# -----------------------------
@admin_verified_req_bp.route("/stats", methods=["GET"])
def get_stats():
    """Get only statistics data"""
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401
        
    stats = get_statistics()
    return jsonify(stats)


# -----------------------------
# FILE PREVIEW WITH DOCUMENT TYPE
# -----------------------------
@admin_verified_req_bp.route("/preview/<path:filename>", methods=["GET"])
def preview_file(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    # Get document type from filename and field name
    document_type = get_document_type(filename)
    
    return jsonify({
        "file_url": f"/{file_path.replace(os.path.sep, '/')}",
        "document_type": document_type
    })


def get_document_type(filename):
    """Extract document type from filename or determine based on field name"""
    # Common patterns in filenames
    filename_lower = filename.lower()
    
    if 'birth' in filename_lower or 'certificate' in filename_lower:
        return 'Birth Certificate'
    elif 'education' in filename_lower or 'credential' in filename_lower:
        return 'Educational Credentials'
    elif 'id' in filename_lower or 'photo' in filename_lower:
        return 'ID Photos'
    elif 'barangay' in filename_lower or 'clearance' in filename_lower:
        return 'Barangay Clearance'
    elif 'medical' in filename_lower:
        return 'Medical Certificate'
    elif 'marriage' in filename_lower:
        return 'Marriage Certificate'
    elif 'valid' in filename_lower:
        return 'Valid ID'
    elif 'transcript' in filename_lower:
        return 'Transcript Form'
    elif 'moral' in filename_lower:
        return 'Good Moral Certificate'
    elif 'envelope' in filename_lower:
        return 'Brown Envelope'
    else:
        # Extract from field name if available in request
        field_name = request.args.get('field', '')
        return DOCUMENT_TYPES.get(field_name, 'Document')


# -----------------------------
# GET DOCUMENT INFO
# -----------------------------
@admin_verified_req_bp.route("/document_info/<int:user_id>/<string:field_name>", methods=["GET"])
def get_document_info(user_id, field_name):
    """Get document information including filename and type"""
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Get the filename for the specific field
        cursor.execute(f"""
            SELECT {field_name} as filename
            FROM student_requirements 
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        
        if not result or not result['filename']:
            return jsonify({"error": "Document not found"}), 404
        
        filename = result['filename']
        document_type = DOCUMENT_TYPES.get(field_name, field_name.replace('_', ' ').title())
        
        return jsonify({
            "filename": filename,
            "document_type": document_type,
            "field_name": field_name
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


# -----------------------------
# ACCEPT VERIFICATION
# -----------------------------
@admin_verified_req_bp.route("/accept/<int:user_id>", methods=["POST"])
def accept_verification(user_id):
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            UPDATE login
            SET verified = 'verified', account_status = 'active'
            WHERE user_id = %s AND role = 'student'
        """, (user_id,))
        db.commit()
        return jsonify({"success": True, "message": "Student successfully verified."})
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e)})
    finally:
        cursor.close()