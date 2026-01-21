from flask import Blueprint, request, jsonify, session, render_template, flash, redirect, url_for
from datetime import datetime
from database import get_db
import json
import re

staff_class_creation_bp = Blueprint('staff_class_creation', __name__)

def validate_time_format(time_str):
    """Validate time format (HH:00) between 6AM and 6PM"""
    try:
        if not time_str.endswith(':00'):
            return False
        hours, minutes = map(int, time_str.split(':'))
        return 6 <= hours <= 18 and minutes == 0
    except (ValueError, AttributeError):
        return False

def calculate_school_year_from_dates(start_date, end_date):
    """Calculate school year in format 'YYYY-YYYY' from start and end dates"""
    try:
        start_year = start_date.year
        end_year = end_date.year
        
        if end_date.year > start_date.year:
            return f"{start_year}-{end_year}"
        else:
            return f"{start_year}-{start_year}"
    except Exception:
        return None

def generate_batch_number(course_id, cursor):
    """Generate simple sequential batch number for each course (1, 2, 3...)."""
    try:
        # Count existing classes for THIS SPECIFIC COURSE
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM classes 
            WHERE course_id = %s
        """, (course_id,))
        result = cursor.fetchone()
        
        existing_count = result['count'] if result and result['count'] is not None else 0
        
        # Next batch number
        batch_num = existing_count + 1
        
        print(f"DEBUG - Course ID: {course_id}, Existing classes: {existing_count}, Next batch: {batch_num}")
        
        return str(batch_num)
        
    except Exception as e:
        print(f"Error generating batch number: {e}")
        import traceback
        traceback.print_exc()
        return "1"  # Fallback to batch 1

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
    if 'user_id' not in session or session.get('role') != 'staff':
        flash('You need to login as staff first', 'error')
        return redirect(url_for('login.login_page'))

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
            # Get active courses with course_code
            cursor.execute("""
                SELECT course_id, course_title, course_code
                FROM courses 
                WHERE course_status = 'active'
                ORDER BY course_title ASC
            """)
            courses = cursor.fetchall()

            return render_template(
                'staffs/staff_class_creation.html',
                courses=courses,
                profile_picture=profile_picture,
                instructor_name=instructor_name,
                now=datetime.now()
            )

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

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

        required_fields = {
            'course_id': 'Course',
            'class_title': 'Class Title',
            'venue': 'Venue',
            'max_students': 'Maximum Students',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'days_of_week': 'Days of Week'
        }

        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({
                'status': 'error',
                'message': f"Missing required fields: {', '.join(required_fields[f] for f in missing)}"
            }), 400

        # Validate dates
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')

        # Validate that end date is after start date
        if end_date <= start_date:
            return jsonify({
                'status': 'error',
                'message': 'End date must be after start date'
            }), 400

        # Check if end date is in the past
        current_date = datetime.now().date()
        end_date_obj = end_date.date()
        if end_date_obj < current_date:
            return jsonify({
                'status': 'error',
                'message': f'End date ({data["end_date"]}) is in the past. Cannot create a class that has already ended.'
            }), 400

        # Calculate school year from dates
        school_year = calculate_school_year_from_dates(start_date, end_date)
        if not school_year:
            return jsonify({
                'status': 'error',
                'message': 'Could not determine school year from dates'
            }), 400

        # Validate school year format
        if not re.match(r'^\d{4}-\d{4}$', school_year):
            return jsonify({
                'status': 'error',
                'message': f'Invalid school year calculated: {school_year}'
            }), 400

        # Validate time slots
        days_json = json.loads(data['days_of_week'])
        for day, times in days_json.items():
            if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid time format. Times must be on the hour (6:00 AM to 6:00 PM).'
                }), 400

        # Get instructor name
        instructor_name = get_instructor_name(cursor, instructor_id)
        if not instructor_name:
            return jsonify({'status': 'error', 'message': 'Instructor name not found. Please complete your profile.'}), 400

        # Get course prerequisites
        cursor.execute(
            "SELECT prerequisites FROM courses WHERE course_id = %s",
            (data['course_id'],)
        )
        course = cursor.fetchone()
        prerequisites = course['prerequisites'] if course else None

        # Generate simple batch number (1, 2, 3...) - UPDATED
        batch = generate_batch_number(data['course_id'], cursor)
        print(f"DEBUG - Final batch number generated: {batch}")

        # Insert class with status 'pending' (for staff)
        cursor.execute("""
            INSERT INTO classes (
                course_id, class_title, school_year, batch, schedule,
                days_of_week, venue, max_students,
                instructor_id, instructor_name,
                start_date, end_date, prerequisites,
                status, date_created
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        """, (
            data['course_id'],
            data['class_title'],
            school_year,  # Calculated from dates
            batch,        # Simple number: "1", "2", "3"...
            data['schedule'],
            data['days_of_week'],
            data['venue'],
            data['max_students'],
            instructor_id,
            instructor_name,
            data['start_date'],
            data['end_date'],
            prerequisites,
            datetime.now()
        ))

        db.commit()

        return jsonify({
            'status': 'success', 
            'message': 'Class created successfully and pending admin approval.',
            'school_year': school_year,
            'batch': batch,  # Simple number like "1", "2", "3"
            'start_date': data['start_date'],
            'end_date': data['end_date']
        })

    except Exception as e:
        db.rollback()
        print(f"Error creating class: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@staff_class_creation_bp.route('/course/prerequisites/<int:course_id>')
def get_prerequisites(course_id):
    """API endpoint to get prerequisites for a course - STAFF VERSION"""
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT prerequisites FROM courses WHERE course_id = %s
        """, (course_id,))
        course = cursor.fetchone()
        
        if course:
            # Return the prerequisites text
            prerequisites_text = course['prerequisites']
            if not prerequisites_text or prerequisites_text.strip() == '':
                prerequisites_text = 'No prerequisites specified.'
            
            return jsonify({
                'status': 'success',
                'prerequisites': prerequisites_text
            })
        else:
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404
    except Exception as e:
        print(f"Error fetching prerequisites: {e}")  # Debug
        return jsonify({'status': 'error', 'message': str(e)}), 500

@staff_class_creation_bp.route('/class/course/prerequisites/<int:course_id>')
def get_prerequisites_alternative(course_id):
    """Alternative API endpoint for prerequisites (in case URL is different)"""
    return get_prerequisites(course_id)