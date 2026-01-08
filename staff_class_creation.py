from flask import Blueprint, request, jsonify, session, render_template
from datetime import datetime
from database import get_db
import json

staff_class_creation_bp = Blueprint('staff_class_creation', __name__)

def validate_time_format(time_str):
    """Validate that time is in HH:00 format (on the hour) and between 6AM and 6PM"""
    try:
        if not time_str.endswith(':00'):
            return False
        hours, minutes = map(int, time_str.split(':'))
        return 6 <= hours <= 18 and minutes == 0 
    except (ValueError, AttributeError):
        return False

def check_staff_verification(cursor, user_id):
    """
    Returns:
      (True, None) → allowed to create class
      (False, message) → blocked with reason
    """
    cursor.execute("""
        SELECT account_status, verified
        FROM login
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()

    if not user:
        return False, "User account not found."

    if user['account_status'] != 'active':
        return False, "Your account is not active. Please contact the administrator."

    if user['verified'] == 'pending':
        return False, (
            "Your account is active but not verified. "
            "Please complete your profile and upload your signature to proceed."
        )

    return True, None

def has_uploaded_signature(cursor, user_id):
    cursor.execute("""
        SELECT signature
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    row = cursor.fetchone()
    return row and row.get('signature')

def get_instructor_name(cursor, user_id):
    """Fetch the full name of the instructor from personal_information table"""
    cursor.execute("""
        SELECT first_name, middle_name, last_name
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    row = cursor.fetchone()
    
    if row:
        # Combine first, middle, and last name
        name_parts = []
        if row.get('first_name'):
            name_parts.append(row['first_name'])
        if row.get('middle_name'):
            name_parts.append(row['middle_name'])
        if row.get('last_name'):
            name_parts.append(row['last_name'])
        
        return ' '.join(name_parts)
    return None

@staff_class_creation_bp.route('/class/create', methods=['GET', 'POST'])
def create_class():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    user_id = session.get('user_id')
    profile_picture = 'default.png'
    instructor_name = None
    
    if user_id:
        # Get profile picture
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']
        
        # Get instructor name automatically
        instructor_name = get_instructor_name(cursor, user_id)

    if request.method == 'GET':
        try:
            query = "SELECT course_id, course_title FROM courses WHERE course_status = 'active'"
            cursor.execute(query)
            courses = cursor.fetchall()

            return render_template(
                'staffs/staff_class_creation.html',
                courses=courses,
                profile_picture=profile_picture,
                instructor_name=instructor_name  # Pass to template
            )

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    elif request.method == 'POST':
        try:
            instructor_id = session.get('user_id')
            if not instructor_id:
                return jsonify({'status': 'error', 'message': 'Instructor not logged in.'}), 401

            allowed, error_message = check_staff_verification(cursor, instructor_id)
            if not allowed:
                return jsonify({
                    'status': 'error',
                    'message': error_message,
                    'redirect': '/staff/profile'  
                }), 403
            
            if not has_uploaded_signature(cursor, instructor_id):
                return jsonify({
                    'status': 'error',
                    'message': 'Please upload your signature in your profile before creating a class.',
                    'redirect': '/staff/profile'
                }), 403

            data = request.form  

            course_id = data.get('course_id')
            class_title = data.get('class_title')
            school_year = data.get('school_year')
            batch = data.get('batch')
            schedule = data.get('schedule')
            venue = data.get('venue')
            max_students = data.get('max_students')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            days_of_week = data.get('days_of_week')
            
            # Get instructor name automatically
            instructor_name = get_instructor_name(cursor, instructor_id)
            if not instructor_name:
                return jsonify({'status': 'error', 'message': 'Instructor name not found. Please complete your profile.'}), 400

            required_fields = {
                'course_id': 'Course',
                'class_title': 'Class Title',
                'school_year': 'School Year',
                'schedule': 'Schedule',
                'venue': 'Venue',
                'max_students': 'Maximum Students',
                'start_date': 'Start Date',
                'end_date': 'End Date',
                'days_of_week': 'Days of Week'
            }

            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({
                    'status': 'error',
                    'message': f"Missing required fields: {', '.join([required_fields[field] for field in missing_fields])}"
                }), 400

            try:
                days_of_week_json = json.loads(days_of_week)
                for day, times in days_of_week_json.items():
                    if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                        return jsonify({
                            'status': 'error',
                            'message': 'Invalid time format. Times must be on the hour (e.g., 7:00, 8:00)'
                        }), 400
                   
                    schedule = f"{day} {times['start']}-{times['end']}"
            except json.JSONDecodeError:
                return jsonify({'status': 'error', 'message': 'Invalid JSON format for days_of_week.'}), 400

            prereq_query = "SELECT prerequisites FROM courses WHERE course_id = %s"
            cursor.execute(prereq_query, (course_id,))
            course = cursor.fetchone()
            if not course:
                return jsonify({'status': 'error', 'message': 'Invalid course selected.'}), 400

            prerequisites = course['prerequisites']
            now = datetime.now()

            insert_query = """
                INSERT INTO classes (
                    course_id, class_title, school_year, batch, schedule, 
                    days_of_week, venue, max_students, instructor_id, instructor_name,
                    start_date, end_date, prerequisites, status, date_created
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            """

            cursor.execute(insert_query, (
                course_id, class_title, school_year, batch, schedule, 
                json.dumps(days_of_week_json), venue, max_students, instructor_id, instructor_name,
                start_date, end_date, prerequisites, now
            ))
            db.commit()

            return jsonify({
                'status': 'success', 
                'message': 'Class created and pending admin approval.'
            })

        except Exception as e:
            db.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500