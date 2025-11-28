from flask import Blueprint, render_template, request, jsonify, session, url_for, redirect
from database import get_db
import json
from datetime import datetime
import mysql.connector

student_homepage_bp = Blueprint('student_homepage', __name__)

# Student homepage route
@student_homepage_bp.route('/student_homepage')
def student_home():
    """Serve the student homepage with user_id from session"""
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback if user has no profile picture

    if not user_id:
        # User not logged in; redirect to login page
        return redirect(url_for('login.login'))  # Adjust to your login blueprint/route

    # Fetch profile picture, verification status, and enrollment status from database
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Get profile picture, verification status, and check if user is enrolled in any class
    cursor.execute("""
        SELECT pi.profile_picture, l.verified, 
               EXISTS(SELECT 1 FROM enrollment WHERE user_id = %s AND status = 'enrolled') as is_enrolled
        FROM personal_information pi
        JOIN login l ON pi.user_id = l.user_id
        WHERE pi.user_id = %s
    """, (user_id, user_id))
    user = cursor.fetchone()
    
    if user:
        if user.get('profile_picture'):
            profile_picture = user['profile_picture']
        
        # Check if user is verified
        is_verified = user.get('verified') == 'verified'
        
        # Check if user is already enrolled in any class
        is_enrolled = user.get('is_enrolled', False)
    else:
        is_verified = False
        is_enrolled = False

    # Check if user has seen the verification notification before
    notification_seen = session.get('verification_notification_seen', False)
    
    # Don't show notification if user is already enrolled
    if is_enrolled:
        notification_seen = True

    return render_template(
        'students/student_homepage.html',
        user_id=user_id,
        profile_picture=profile_picture,
        is_verified=is_verified,
        notification_seen=notification_seen,
        is_enrolled=is_enrolled
    )


@student_homepage_bp.route('/schedule')
def student_schedule():
    """Serve the schedule section with user_id from session"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401
        
    return render_template('students/student_homepage.html', user_id=user_id, active_tab='schedule')

@student_homepage_bp.route('/api/schedule/<int:user_id>', methods=['GET'])
def get_user_schedule(user_id):
    """Get the schedule for a specific student"""
    connection = get_db()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Verify user exists and is a student
        cursor.execute("""
            SELECT role FROM login 
            WHERE user_id = %s AND role = 'student' AND account_status = 'active'
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found or not an active student'}), 404

        # Get all active classes the user is enrolled in
        cursor.execute("""
            SELECT c.class_id, c.class_title, c.course_id, c.schedule, 
                   c.days_of_week, c.venue, c.start_date, c.end_date,
                   co.course_title, co.course_code
            FROM enrollment e
            JOIN classes c ON e.class_id = c.class_id
            JOIN courses co ON c.course_id = co.course_id
            WHERE e.user_id = %s 
            AND c.status = 'active'
            AND e.status = 'enrolled'
        """, (user_id,))
        
        enrolled_classes = cursor.fetchall()

        # Process the schedule data
        schedule = []
        today = datetime.now().date()
        
        for cls in enrolled_classes:
            days_schedule = {}
            if cls['days_of_week']:
                try:
                    days_schedule = json.loads(cls['days_of_week'])
                except json.JSONDecodeError:
                    days_schedule = {}

            class_info = {
                'class_id': cls['class_id'],
                'title': f"{cls['course_code']} - {cls['class_title']}",
                'course': cls['course_title'],
                'venue': cls['venue'],
                'start_date': cls['start_date'].isoformat() if cls['start_date'] else None,
                'end_date': cls['end_date'].isoformat() if cls['end_date'] else None,
                'schedule': cls['schedule'],
                'days': [{
                    'day': day,
                    'start_time': times.get('start', ''),
                    'end_time': times.get('end', '')
                } for day, times in days_schedule.items()]
            }
            schedule.append(class_info)

        return jsonify({
            'user_id': user_id,
            'schedule': schedule,
            'current_date': today.isoformat()
        })

    except mysql.connector.Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@student_homepage_bp.route('/api/mark_notification_seen', methods=['POST'])
def mark_notification_seen():
    """Mark the verification notification as seen"""
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    
    session['verification_notification_seen'] = True
    return jsonify({'success': True})

@student_homepage_bp.route('/api/user/statistics/<int:user_id>', methods=['GET'])
def get_user_statistics(user_id):
    """Get user statistics for the dashboard"""
    connection = get_db()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Verify user exists and is a student
        cursor.execute("""
            SELECT role FROM login 
            WHERE user_id = %s AND role = 'student' AND account_status = 'active'
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found or not an active student'}), 404

        # Get enrolled courses count
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM enrollment 
            WHERE user_id = %s AND status = 'enrolled'
        """, (user_id,))
        enrolled_result = cursor.fetchone()
        enrolled_courses = enrolled_result['count'] if enrolled_result else 0

        # Get pending courses count
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM enrollment 
            WHERE user_id = %s AND status = 'pending'
        """, (user_id,))
        pending_result = cursor.fetchone()
        pending_courses = pending_result['count'] if pending_result else 0

        # Get completed courses count
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM enrollment e
            JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.user_id = %s AND sg.remarks = 'Completed'
        """, (user_id,))
        completed_result = cursor.fetchone()
        completed_courses = completed_result['count'] if completed_result else 0

        return jsonify({
            'success': True,
            'data': {
                'enrolled_courses': enrolled_courses,
                'pending_courses': pending_courses,
                'completed_courses': completed_courses
            }
        })

    except mysql.connector.Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()