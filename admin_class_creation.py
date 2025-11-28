from flask import Blueprint, request, jsonify, session, render_template, flash, redirect, url_for
from datetime import datetime
from database import get_db
import json

admin_class_creation_bp = Blueprint('admin_class_creation', __name__)

def validate_time_format(time_str):
    """Validate that time is in HH:00 format (on the hour) and between 6AM and 6PM"""
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

    if request.method == 'GET':
        try:
            # --- Fetch courses ---
            query = "SELECT course_id, course_title FROM courses WHERE course_status = 'active'"
            cursor.execute(query)
            courses = cursor.fetchall()

            # --- Fetch admin profile picture ---
            profile_picture = 'default.png'
            try:
                cursor.execute("""
                    SELECT profile_picture 
                    FROM personal_information 
                    WHERE user_id = %s
                """, (session['user_id'],))
                result = cursor.fetchone()
                if result and result.get('profile_picture'):
                    profile_picture = result['profile_picture']
            except Exception:
                profile_picture = 'default.png'

            return render_template(
                'admin/admin_class_creation.html',
                courses=courses,
                profile_picture=profile_picture
            )

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    elif request.method == 'POST':
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
                'instructor_name': 'Instructor Name'
            }

            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({
                    'status': 'error',
                    'message': f"Missing required fields: {', '.join([required_fields[field] for field in missing_fields])}"
                }), 400

            try:
                days_of_week_json = json.loads(data['days_of_week'])
                for day, times in days_of_week_json.items():
                    if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                        return jsonify({
                            'status': 'error',
                            'message': 'Invalid time format. Times must be on the hour (e.g., 7:00, 8:00)'
                        }), 400
            except json.JSONDecodeError:
                return jsonify({'status': 'error', 'message': 'Invalid JSON format for days_of_week.'}), 400

            insert_query = """
                INSERT INTO classes (
                    course_id, class_title, school_year, batch, schedule, 
                    days_of_week, venue, max_students, instructor_id, instructor_name,
                    start_date, end_date, prerequisites, status, date_created
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s)
            """

            prereq_query = "SELECT prerequisites FROM courses WHERE course_id = %s"
            cursor.execute(prereq_query, (data['course_id'],))
            course = cursor.fetchone()
            prerequisites = course['prerequisites'] if course else None

            cursor.execute(insert_query, (
                data['course_id'],
                data['class_title'],
                data['school_year'],
                data.get('batch'),
                data['schedule'],
                data['days_of_week'],
                data['venue'],
                data['max_students'],
                session.get('user_id'), 
                data['instructor_name'],
                data['start_date'],
                data['end_date'],
                prerequisites,
                datetime.now()
            ))
            db.commit()

            return jsonify({
                'status': 'success', 
                'message': 'Class created successfully.'
            })

        except Exception as e:
            db.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500
