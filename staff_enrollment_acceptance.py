from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from datetime import datetime
from database import get_db

staff_enrollment_acceptance_bp = Blueprint('staff_enrollment_acceptance', __name__, url_prefix='/staff')

@staff_enrollment_acceptance_bp.route('/enrollment_acceptance', methods=['GET']) 
def view_enrollment_requests():
    if 'user_id' not in session or session.get('role') != 'staff':
        flash("Unauthorized access. Please log in as staff.")
        return redirect(url_for('login.login_page'))

    staff_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Fetch staff profile picture
    profile_picture = 'default.png'
    cursor.execute("""
        SELECT profile_picture
        FROM personal_information
        WHERE user_id = %s
    """, (staff_id,))
    user = cursor.fetchone()
    if user and user.get('profile_picture'):
        profile_picture = user['profile_picture']

    # Get the classes assigned to this staff member as instructor
    cursor.execute("""
        SELECT class_id FROM classes WHERE instructor_id = %s
    """, (staff_id,))
    class_ids = [row['class_id'] for row in cursor.fetchall()]

    if not class_ids:
        flash("You are not assigned as instructor to any classes.")
        return render_template(
            'staffs/staff_enrollment_acceptance.html',
            enrollments=[],
            profile_picture=profile_picture
        )

    # Fetch all pending enrollments for classes where this staff is the instructor
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
            l.email,
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
            sr.birth_certificate,
            sr.educational_credentials,
            sr.id_photos,
            sr.barangay_clearance,
            sr.medical_certificate,
            sr.marriage_certificate,
            sr.valid_id,
            sr.transcript_form,
            sr.good_moral_certificate,
            sr.brown_envelope,
            sr.additional_notes
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
        flash("Unauthorized action.")
        return redirect(url_for('login.login_page'))

    enrollment_id = request.form.get('enrollment_id')
    action = request.form.get('action') 

    if not enrollment_id or action not in ['accept', 'reject']:
        flash("Invalid request.")
        return redirect(url_for('staff_enrollment_acceptance.view_enrollment_requests'))

    new_status = 'enrolled' if action == 'accept' else 'rejected'

    db = get_db()
    cursor = db.cursor()
    
    # Verify that the staff member is authorized to manage this enrollment
    cursor.execute("""
        SELECT cl.class_id 
        FROM enrollment e
        JOIN classes cl ON e.class_id = cl.class_id
        WHERE e.enrollment_id = %s AND cl.instructor_id = %s
    """, (enrollment_id, session['user_id']))
    
    authorized = cursor.fetchone()
    if not authorized:
        flash("You are not authorized to manage this enrollment.")
        return redirect(url_for('staff_enrollment_acceptance.view_enrollment_requests'))

    cursor.execute("""
        UPDATE enrollment SET status = %s WHERE enrollment_id = %s
    """, (new_status, enrollment_id))
    db.commit()

    flash(f"Enrollment request has been {new_status}.")
    return redirect(url_for('staff_enrollment_acceptance.view_enrollment_requests'))

@staff_enrollment_acceptance_bp.route('/enrollment_acceptance/details/<int:enrollment_id>')
def get_enrollment_details(enrollment_id):
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            e.*,
            pi.first_name, pi.middle_name, pi.last_name,
            pi.date_of_birth, pi.gender, pi.contact_number,
            pi.province, pi.municipality, pi.baranggay,
            l.email,
            cl.class_title, cl.schedule, cl.venue,
            co.course_title, co.course_description,
            sr.*
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