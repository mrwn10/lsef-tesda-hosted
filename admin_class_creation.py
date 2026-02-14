from flask import Blueprint, request, jsonify, session, render_template, flash, redirect, url_for
from datetime import datetime
from database import get_db
import json
import re

admin_class_creation_bp = Blueprint('admin_class_creation', __name__)

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
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM classes 
            WHERE course_id = %s
        """, (course_id,))
        result = cursor.fetchone()
        
        existing_count = result['count'] if result and result['count'] is not None else 0
        
        batch_num = existing_count + 1
        
        print(f"DEBUG - Course ID: {course_id}, Existing classes: {existing_count}, Next batch: {batch_num}")
        
        return str(batch_num)
        
    except Exception as e:
        print(f"Error generating batch number: {e}")
        import traceback
        traceback.print_exc()
        return "1"  

@admin_class_creation_bp.route('/admin/class/create', methods=['GET', 'POST'])
def create_class():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    if request.method == 'GET':
        try:
            cursor.execute("""
                SELECT course_id, course_title, course_code
                FROM courses 
                WHERE course_status = 'active'
            """)
            courses = cursor.fetchall()

            cursor.execute("""
                SELECT 
                    u.user_id,
                    CONCAT(p.first_name, ' ', p.last_name) AS full_name
                FROM login u
                JOIN personal_information p ON u.user_id = p.user_id
                WHERE u.account_status = 'active' AND u.verified = 'verified'
                  AND u.role = 'staff'
                ORDER BY full_name ASC
            """)
            instructors = cursor.fetchall()

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
                profile_picture=profile_picture,
                now=datetime.now()
            )

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    try:
        data = request.form

        required_fields = {
            'course_id': 'Course',
            'class_title': 'Class Title',
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

        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')

        if end_date <= start_date:
            return jsonify({
                'status': 'error',
                'message': 'End date must be after start date'
            }), 400

        current_date = datetime.now().date()
        end_date_obj = end_date.date()
        if end_date_obj < current_date:
            return jsonify({
                'status': 'error',
                'message': f'End date ({data["end_date"]}) is in the past. Cannot create a class that has already ended.'
            }), 400

        school_year = calculate_school_year_from_dates(start_date, end_date)
        if not school_year:
            return jsonify({
                'status': 'error',
                'message': 'Could not determine school year from dates'
            }), 400

        if not re.match(r'^\d{4}-\d{4}$', school_year):
            return jsonify({
                'status': 'error',
                'message': f'Invalid school year calculated: {school_year}'
            }), 400

        days_json = json.loads(data['days_of_week'])
        for _, times in days_json.items():
            if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid time format. Times must be on the hour (6:00 AM to 6:00 PM).'
                }), 400

        cursor.execute("""
            SELECT CONCAT(p.first_name, ' ', p.last_name) AS full_name
            FROM personal_information p
            WHERE p.user_id = %s
        """, (data['instructor_id'],))
        instructor = cursor.fetchone()

        if not instructor:
            return jsonify({'status': 'error', 'message': 'Invalid instructor selected'}), 400

        instructor_name = instructor['full_name']

        cursor.execute(
            "SELECT prerequisites FROM courses WHERE course_id = %s",
            (data['course_id'],)
        )
        course = cursor.fetchone()
        prerequisites = course['prerequisites'] if course else None

        batch = generate_batch_number(data['course_id'], cursor)
        print(f"DEBUG - Final batch number generated: {batch}")

        cursor.execute("""
            INSERT INTO classes (
                course_id, class_title, school_year, batch, schedule,
                days_of_week, venue, max_students,
                instructor_id, instructor_name,
                start_date, end_date, prerequisites,
                status, date_created
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'open', %s)
        """, (
            data['course_id'],
            data['class_title'],
            school_year,  
            batch,        
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

        return jsonify({
            'status': 'success', 
            'message': f'Class created successfully.',
            'school_year': school_year,
            'batch': batch,  
            'start_date': data['start_date'],
            'end_date': data['end_date']
        })

    except Exception as e:
        db.rollback()
        print(f"Error creating class: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_class_creation_bp.route('/course/prerequisites/<int:course_id>')
def get_prerequisites(course_id):
    """API endpoint to get prerequisites for a course"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT prerequisites FROM courses WHERE course_id = %s
        """, (course_id,))
        course = cursor.fetchone()
        
        if course:
            return jsonify({
                'status': 'success',
                'prerequisites': course['prerequisites'] or 'No prerequisites specified.'
            })
        else:
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500