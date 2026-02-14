from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from datetime import datetime
from database import get_db

staff_enrollment_acceptance_bp = Blueprint('staff_enrollment_acceptance', __name__, url_prefix='/staff')

@staff_enrollment_acceptance_bp.route('/enrollment_acceptance', methods=['GET']) 
def view_enrollment_requests():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access. Please log in as staff.'}), 401

    staff_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)
 
    profile_picture = 'default.png'
    cursor.execute("""
        SELECT profile_picture
        FROM personal_information
        WHERE user_id = %s
    """, (staff_id,))
    user = cursor.fetchone()
    if user and user.get('profile_picture'):
        profile_picture = user['profile_picture']
 
    cursor.execute("""
        SELECT class_id FROM classes WHERE instructor_id = %s
    """, (staff_id,))
    class_ids = [row['class_id'] for row in cursor.fetchall()]

    if not class_ids:
        return render_template(
            'staffs/staff_enrollment_acceptance.html',
            enrollments=[],
            profile_picture=profile_picture
        )
 
    format_strings = ','.join(['%s'] * len(class_ids))
    cursor.execute(f"""
        SELECT 
            e.enrollment_id, 
            e.user_id, 
            e.class_id, 
            e.status,
            pi.first_name, 
            pi.middle_name, 
            pi.last_name,
            l.username,
            l.email,
            pi.contact_number,
            cl.class_title, 
            cl.schedule, 
            cl.venue, 
            cl.max_students, 
            cl.start_date, 
            cl.end_date,
            co.course_title, 
            co.course_description, 
            co.course_category,
            co.learning_outcomes, 
            co.course_fee, 
            co.prerequisites AS course_prerequisites,
            sr.barangay_clearance,
            sr.medical_certificate,
            sr.marriage_certificate,
            sr.valid_id,
            sr.transcript_form,
            sr.additional_notes,
            pi.profile_picture as student_profile_picture,
            CASE 
                WHEN sr.barangay_clearance IS NOT NULL 
                AND sr.medical_certificate IS NOT NULL 
                AND sr.valid_id IS NOT NULL 
                AND sr.transcript_form IS NOT NULL 
                AND (pi.gender != 'female' OR sr.marriage_certificate IS NOT NULL OR pi.gender = 'male')
                THEN 'complete' 
                ELSE 'incomplete' 
            END AS requirements_status
        FROM enrollment e
        JOIN personal_information pi ON e.user_id = pi.user_id
        JOIN login l ON e.user_id = l.user_id
        JOIN classes cl ON e.class_id = cl.class_id
        JOIN courses co ON cl.course_id = co.course_id
        LEFT JOIN student_requirements sr ON e.user_id = sr.user_id
        WHERE e.status = 'pending' AND cl.class_id IN ({format_strings})
        ORDER BY e.enrollment_date DESC
    """, tuple(class_ids))

    enrollments = cursor.fetchall()

    return render_template(
        'staffs/staff_enrollment_acceptance.html',
        enrollments=enrollments,
        profile_picture=profile_picture
    )

@staff_enrollment_acceptance_bp.route('/enrollment_acceptance/action', methods=['POST'])
def handle_enrollment_action():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'success': False, 'error': 'Unauthorized action.'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON data.'}), 400
    
    enrollment_id = data.get('enrollment_id')
    action = data.get('action')

    if not enrollment_id or action not in ['accept', 'reject']:
        return jsonify({'success': False, 'error': 'Invalid request parameters.'}), 400

    new_status = 'enrolled' if action == 'accept' else 'rejected'

    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try: 
        cursor.execute("""
            SELECT cl.class_id 
            FROM enrollment e
            JOIN classes cl ON e.class_id = cl.class_id
            WHERE e.enrollment_id = %s AND cl.instructor_id = %s
        """, (enrollment_id, session['user_id']))
        
        authorized = cursor.fetchone()
        if not authorized:
            return jsonify({'success': False, 'error': 'You are not authorized to manage this enrollment.'}), 403
         
        cursor.execute("""
            UPDATE enrollment SET status = %s WHERE enrollment_id = %s
        """, (new_status, enrollment_id))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f"Enrollment request has been {new_status} successfully.",
            'enrollment_id': enrollment_id,
            'new_status': new_status,
            'action': action
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()

@staff_enrollment_acceptance_bp.route('/enrollment_acceptance/details/<int:enrollment_id>')
def get_enrollment_details(enrollment_id):
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                e.*,
                pi.first_name, 
                pi.middle_name, 
                pi.last_name,
                pi.date_of_birth, 
                pi.gender, 
                pi.contact_number,
                pi.province, 
                pi.municipality, 
                pi.baranggay,
                pi.profile_picture as student_profile_picture,
                l.username,
                l.email,
                cl.class_title, 
                cl.schedule, 
                cl.venue,
                co.course_title, 
                co.course_description,
                sr.barangay_clearance,
                sr.medical_certificate,
                sr.marriage_certificate,
                sr.valid_id,
                sr.transcript_form,
                sr.additional_notes,
                CASE 
                    WHEN sr.barangay_clearance IS NOT NULL 
                    AND sr.medical_certificate IS NOT NULL 
                    AND sr.valid_id IS NOT NULL 
                    AND sr.transcript_form IS NOT NULL 
                    AND (pi.gender != 'female' OR sr.marriage_certificate IS NOT NULL)
                    THEN 'complete' 
                    ELSE 'incomplete' 
                END AS requirements_status
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN login l ON e.user_id = l.user_id
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            LEFT JOIN student_requirements sr ON e.user_id = sr.user_id
            WHERE e.enrollment_id = %s
        """, (enrollment_id,))
        
        enrollment = cursor.fetchone()
        
        if not enrollment:
            return jsonify({'error': 'Enrollment not found'}), 404
        
        return jsonify(enrollment)
    except Exception as e:
        return jsonify({'error': 'Database error'}), 500
    finally:
        cursor.close()