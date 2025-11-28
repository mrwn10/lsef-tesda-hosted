from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from datetime import datetime
from database import get_db

admin_enrollment_bp = Blueprint('admin_enrollment', __name__, url_prefix='/admin')

@admin_enrollment_bp.route('/enrollment_management', methods=['GET'])
def view_enrollments():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash("Unauthorized access. Please log in as admin.")
        return redirect(url_for('login.login_page'))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = session.get('user_id')
    profile_picture = 'default.png'  # Default fallback image

    # Fetch admin's profile picture
    if user_id:
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']

    # Get filter parameters
    status_filter = request.args.get('status', 'all')
    course_filter = request.args.get('course', 'all')
    search_query = request.args.get('search', '')

    # Base query
    query = """
        SELECT e.enrollment_id, e.user_id, e.class_id, e.status, e.enrollment_date,
               pi.first_name, pi.middle_name, pi.last_name,
               l.email, l.role,
               cl.class_title, cl.schedule, cl.venue, cl.max_students, cl.start_date, cl.end_date,
               co.course_title, co.course_description, co.course_category
        FROM enrollment e
        JOIN personal_information pi ON e.user_id = pi.user_id
        JOIN login l ON e.user_id = l.user_id
        JOIN classes cl ON e.class_id = cl.class_id
        JOIN courses co ON cl.course_id = co.course_id
    """

    # Add filters
    conditions = []
    params = []

    if status_filter != 'all':
        conditions.append("e.status = %s")
        params.append(status_filter)

    if course_filter != 'all':
        conditions.append("co.course_id = %s")
        params.append(course_filter)

    if search_query:
        conditions.append("""
            (pi.first_name LIKE %s OR 
             pi.last_name LIKE %s OR 
             l.email LIKE %s OR 
             cl.class_title LIKE %s OR 
             co.course_title LIKE %s)
        """)
        search_term = f"%{search_query}%"
        params.extend([search_term, search_term, search_term, search_term, search_term])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY e.enrollment_date DESC"

    cursor.execute(query, tuple(params))
    enrollments = cursor.fetchall()

    # Get distinct courses for filter dropdown
    cursor.execute("SELECT course_id, course_title FROM courses ORDER BY course_title")
    courses = cursor.fetchall()

    return render_template('admin/admin_enrollment.html',
                           enrollments=enrollments,
                           courses=courses,
                           current_status=status_filter,
                           current_course=course_filter,
                           search_query=search_query,
                           profile_picture=profile_picture)


@admin_enrollment_bp.route('/enrollment_management/update_status', methods=['POST'])
def update_enrollment_status():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    enrollment_id = data.get('enrollment_id')
    new_status = data.get('status')

    if not enrollment_id or not new_status:
        return jsonify({'success': False, 'message': 'Missing parameters'}), 400

    valid_statuses = ['pending', 'enrolled', 'rejected', 'completed', 'dropped']
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400

    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            UPDATE enrollment 
            SET status = %s 
            WHERE enrollment_id = %s
        """, (new_status, enrollment_id))
        db.commit()
        
        # Get updated enrollment info for response
        cursor.execute("""
            SELECT e.status, 
                   CONCAT(pi.first_name, ' ', pi.last_name) AS student_name,
                   co.course_title,
                   cl.class_title
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            WHERE e.enrollment_id = %s
        """, (enrollment_id,))
        enrollment_info = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'message': f"Enrollment status updated to {new_status}",
            'enrollment': enrollment_info
        })
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_enrollment_bp.route('/enrollment_management/details/<int:enrollment_id>', methods=['GET'])
def enrollment_details(enrollment_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # First verify the enrollment exists
        cursor.execute("SELECT 1 FROM enrollment WHERE enrollment_id = %s", (enrollment_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Enrollment not found'}), 404

        # Get detailed enrollment information
        cursor.execute("""
            SELECT 
                e.enrollment_id, 
                e.status, 
                e.enrollment_date, 
                
                CONCAT(pi.first_name, ' ', pi.last_name) AS student_name,
                l.email, 
                l.role,
                co.course_title, 
                cl.class_title, 
                cl.schedule, 
                cl.venue,
                cl.start_date,
                cl.end_date,
                cl.max_students
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN login l ON e.user_id = l.user_id
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            WHERE e.enrollment_id = %s
        """, (enrollment_id,))
        
        enrollment_info = cursor.fetchone()
        
        if not enrollment_info:
            return jsonify({'success': False, 'message': 'Enrollment details not found'}), 404

        # Convert dates to strings for JSON serialization
        if enrollment_info['enrollment_date']:
            enrollment_info['enrollment_date'] = enrollment_info['enrollment_date'].isoformat()
        # if enrollment_info['last_updated']:
        #     enrollment_info['last_updated'] = enrollment_info['last_updated'].isoformat()
        if enrollment_info['start_date']:
            enrollment_info['start_date'] = enrollment_info['start_date'].isoformat()
        if enrollment_info['end_date']:
            enrollment_info['end_date'] = enrollment_info['end_date'].isoformat()

        return jsonify({
            'success': True,
            'message': 'Enrollment details retrieved',
            'enrollment': enrollment_info
        })

    except Exception as e:
        import traceback
        traceback.print_exc()  # Print the full traceback to console for debugging
        return jsonify({
            'success': False,
            'message': f'Error fetching enrollment details: {str(e)}'
        }), 500

@admin_enrollment_bp.route('/enrollment_management/enroll_student', methods=['POST'])
def enroll_student():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = data.get('user_id')
    class_id = data.get('class_id')

    if not user_id or not class_id:
        return jsonify({'success': False, 'message': 'Missing parameters'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Check if enrollment already exists
        cursor.execute("""
            SELECT enrollment_id, status 
            FROM enrollment 
            WHERE user_id = %s AND class_id = %s
        """, (user_id, class_id))
        existing_enrollment = cursor.fetchone()

        if existing_enrollment:
            if existing_enrollment['status'] == 'enrolled':
                return jsonify({
                    'success': False,
                    'message': 'Student is already enrolled in this class'
                }), 400
            else:
                # Update existing enrollment
                cursor.execute("""
                    UPDATE enrollment 
                    SET status = 'enrolled', enrollment_date = NOW() 
                    WHERE enrollment_id = %s
                """, (existing_enrollment['enrollment_id'],))
        else:
            # Create new enrollment
            cursor.execute("""
                INSERT INTO enrollment (user_id, class_id, status, enrollment_date)
                VALUES (%s, %s, 'enrolled', NOW())
            """, (user_id, class_id))

        db.commit()

        # Get enrollment details for response
        cursor.execute("""
            SELECT e.enrollment_id, e.status, e.enrollment_date,
                   CONCAT(pi.first_name, ' ', pi.last_name) AS student_name,
                   co.course_title, cl.class_title
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            WHERE e.user_id = %s AND e.class_id = %s
        """, (user_id, class_id))
        enrollment_info = cursor.fetchone()

        return jsonify({
            'success': True,
            'message': 'Student enrolled successfully',
            'enrollment': enrollment_info
        })
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500