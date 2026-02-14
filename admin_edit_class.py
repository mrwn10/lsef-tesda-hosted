from flask import Blueprint, request, jsonify, session, render_template, flash, redirect, url_for
from datetime import datetime
from database import get_db
import json

admin_edit_class_bp = Blueprint('admin_edit_class', __name__)

def validate_time_format(time_str):
    """Validate that time is in HH:00 format (on the hour) and between 6AM and 6PM"""
    try:
        if not time_str.endswith(':00'):
            return False
        hours, minutes = map(int, time_str.split(':'))
        return 6 <= hours <= 18 and minutes == 0 
    except (ValueError, AttributeError):
        return False

@admin_edit_class_bp.route('/admin/edit_class', methods=['GET'])
def view_editable_classes():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                cl.class_id, cl.class_title, cl.schedule, cl.venue, cl.max_students,
                cl.start_date, cl.end_date, cl.status, cl.date_created,
                cl.school_year, cl.batch, cl.days_of_week, cl.instructor_name,
                cl.instructor_id, cl.course_id, cl.prerequisites,
                (SELECT COUNT(*) FROM enrollment e WHERE e.class_id = cl.class_id AND e.status IN ('enrolled', 'completed')) as current_students,
                co.course_title, co.course_code, co.course_description
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            WHERE cl.status IN ('pending', 'open', 'ongoing', 'completed', 'cancelled', 'edited')
            ORDER BY 
                CASE cl.status
                    WHEN 'pending' THEN 1
                    WHEN 'open' THEN 2
                    WHEN 'ongoing' THEN 3
                    WHEN 'completed' THEN 4
                    WHEN 'cancelled' THEN 5
                    WHEN 'edited' THEN 6
                    ELSE 7
                END,
                cl.date_created DESC
        """
        cursor.execute(query)
        classes = cursor.fetchall()

        for cls in classes:
            cls['start_date'] = cls['start_date'].isoformat() if cls['start_date'] else None
            cls['end_date'] = cls['end_date'].isoformat() if cls['end_date'] else None
            if cls['days_of_week']:
                cls['days_of_week'] = json.loads(cls['days_of_week'])
            else:
                cls['days_of_week'] = {}

        cursor.execute("""
            SELECT u.user_id, pi.first_name, pi.last_name, pi.profile_picture
            FROM login u
            JOIN personal_information pi ON u.user_id = pi.user_id
            WHERE u.role = 'staff' AND u.account_status = 'active'
        """)
        instructors = cursor.fetchall()

        cursor.execute("""
            SELECT course_id, course_code, course_title
            FROM courses 
            WHERE course_status = 'active' AND published = 1
            ORDER BY course_title
        """)
        courses = cursor.fetchall()

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

        cursor.close()

        return render_template(
            'admin/admin_edit_class.html',
            classes=classes,
            instructors=instructors,
            courses=courses,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_edit_class_bp.route('/admin/update_class', methods=['POST'])
def update_class():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        data = request.get_json()

        required_fields = {
            'class_id': 'Class ID',
            'class_title': 'Class Title',
            'school_year': 'School Year',
            'instructor_name': 'Instructor Name',
            'venue': 'Venue',
            'max_students': 'Max Students',
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

        if data['days_of_week']:
            for day, times in data['days_of_week'].items():
                if not validate_time_format(times.get('start')) or not validate_time_format(times.get('end')):
                    return jsonify({
                        'status': 'error',
                        'message': 'Invalid time format. Times must be on the hour (e.g., 7:00, 8:00)'
                    }), 400

        schedule = []
        for day, times in data['days_of_week'].items():
            start_hour = int(times['start'].split(':')[0])
            end_hour = int(times['end'].split(':')[0])
            start_ampm = 'AM' if start_hour < 12 else 'PM'
            end_ampm = 'AM' if end_hour < 12 else 'PM'
            start_hour12 = start_hour % 12 or 12
            end_hour12 = end_hour % 12 or 12
            schedule.append(f"{day} {start_hour12}:00 {start_ampm}-{end_hour12}:00 {end_ampm}")
        schedule_text = ", ".join(schedule)

        cursor.execute("SELECT status FROM classes WHERE class_id = %s", (data['class_id'],))
        class_data = cursor.fetchone()
        
        if not class_data:
            return jsonify({'status': 'error', 'message': 'Class not found'}), 404

        # Keep the original status, don't change it
        current_status = class_data['status']

        update_query = """
            UPDATE classes
            SET 
                class_title = %s,
                school_year = %s,
                batch = %s,
                schedule = %s,
                venue = %s,
                max_students = %s,
                start_date = %s,
                end_date = %s,
                days_of_week = %s,
                instructor_name = %s,
                date_updated = %s
            WHERE class_id = %s
        """
        
        now = datetime.now()
        cursor.execute(update_query, (
            data['class_title'],
            data['school_year'],
            data.get('batch'),
            schedule_text,
            data['venue'],
            data['max_students'],
            data['start_date'],
            data['end_date'],
            json.dumps(data['days_of_week']),
            data['instructor_name'],
            now,
            data['class_id']
        ))
        db.commit()

        # FIXED: Don't return duplicate 'status' key
        return jsonify({
            'result': 'success',
            'message': 'Class updated successfully',
            'original_status': current_status
        })

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_edit_class_bp.route('/admin/update_class_status', methods=['POST'])
def update_class_status():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        data = request.get_json()

        class_id = data.get('class_id')
        new_status = data.get('status')

        if not class_id or not new_status:
            return jsonify({
                'status': 'error',
                'message': 'Class ID and status are required'
            }), 400

        valid_statuses = ['pending', 'open', 'ongoing', 'completed', 'cancelled', 'edited']
        if new_status not in valid_statuses:
            return jsonify({
                'status': 'error',
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400

        # Check if class exists
        cursor.execute("SELECT status FROM classes WHERE class_id = %s", (class_id,))
        class_data = cursor.fetchone()
        
        if not class_data:
            return jsonify({'status': 'error', 'message': 'Class not found'}), 404

        # Update the status
        update_query = """
            UPDATE classes
            SET status = %s, date_updated = %s
            WHERE class_id = %s
        """
        
        now = datetime.now()
        cursor.execute(update_query, (new_status, now, class_id))
        db.commit()

        return jsonify({
            'status': 'success',
            'message': f'Class status updated to {new_status} successfully'
        })

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500