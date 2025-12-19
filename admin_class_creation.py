from flask import Blueprint, request, jsonify, session, render_template, flash, redirect, url_for
from datetime import datetime
from database import get_db
import json

admin_class_creation_bp = Blueprint('admin_class_creation', __name__)

def validate_time_format(time_str):
    try:
        if not time_str.endswith(':00'):
            return False
        hours, minutes = map(int, time_str.split(':'))
        return 6 <= hours <= 18 and minutes == 0
    except (ValueError, AttributeError):
        return False


@admin_class_creation_bp.route('/admin/class/create', methods=['GET', 'POST'])
def create_class():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # =======================
    # GET REQUEST
    # =======================
    if request.method == 'GET':
        try:
            # Fetch active courses
            cursor.execute("""
                SELECT course_id, course_title 
                FROM courses 
                WHERE course_status = 'active'
            """)
            courses = cursor.fetchall()

            # Fetch active staff instructors
            cursor.execute("""
                SELECT 
                    u.user_id,
                    CONCAT(p.first_name, ' ', p.last_name) AS full_name
                FROM login u
                JOIN personal_information p ON u.user_id = p.user_id
                WHERE u.account_status = 'active'
                  AND u.role = 'staff'
                ORDER BY full_name ASC
            """)
            instructors = cursor.fetchall()

            # Fetch admin profile picture
            profile_picture = 'default.png'
            cursor.execute("""
                SELECT profile_picture 
                FROM personal_information 
                WHERE user_id = %s
            """, (session['user_id'],))
            result = cursor.fetchone()
            if result and result.get('profile_picture'):
                profile_picture = result['profile_picture']

            return render_template(
                'admin/admin_class_creation.html',
                courses=courses,
                instructors=instructors,
                profile_picture=profile_picture
            )

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    # =======================
    # POST REQUEST
    # =======================
    try:
        data = request.form

        required_fields = {
            'course_id': 'Course',
            'class_title': 'Class Title',
            'school_year': 'School Year',
            'schedule': 'Schedule',
            'venue': 'Venue',
            'max_students': 'Maximum Students',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'days_of_week': 'Days of Week',
            'instructor_id': 'Instructor'
        }

        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({
                'status': 'error',
                'message': f"Missing required fields: {', '.join(required_fields[f] for f in missing)}"
            }), 400

        # Validate days_of_week JSON
        days_json = json.loads(data['days_of_week'])
        for _, times in days_json.items():
            if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid time format. Times must be on the hour.'
                }), 400

        # Get instructor full name
        cursor.execute("""
            SELECT CONCAT(p.first_name, ' ', p.last_name) AS full_name
            FROM personal_information p
            WHERE p.user_id = %s
        """, (data['instructor_id'],))
        instructor = cursor.fetchone()

        if not instructor:
            return jsonify({'status': 'error', 'message': 'Invalid instructor selected'}), 400

        instructor_name = instructor['full_name']

        # Fetch course prerequisites
        cursor.execute(
            "SELECT prerequisites FROM courses WHERE course_id = %s",
            (data['course_id'],)
        )
        course = cursor.fetchone()
        prerequisites = course['prerequisites'] if course else None

        # Insert class
        cursor.execute("""
            INSERT INTO classes (
                course_id, class_title, school_year, batch, schedule,
                days_of_week, venue, max_students,
                instructor_id, instructor_name,
                start_date, end_date, prerequisites,
                status, date_created
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s)
        """, (
            data['course_id'],
            data['class_title'],
            data['school_year'],
            data.get('batch'),
            data['schedule'],
            data['days_of_week'],
            data['venue'],
            data['max_students'],
            data['instructor_id'],
            instructor_name,
            data['start_date'],
            data['end_date'],
            prerequisites,
            datetime.now()
        ))

        db.commit()

        return jsonify({'status': 'success', 'message': 'Class created successfully.'})

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
