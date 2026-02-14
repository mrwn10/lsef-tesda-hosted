from flask import Blueprint, request, jsonify, session, render_template
from datetime import datetime
from database import get_db
import json
import re

student_view_class_bp = Blueprint('student_view_class', __name__)

@student_view_class_bp.route('/student/view_classes', methods=['GET'])
def view_enrolled_classes():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        student_id = session.get('user_id')
        profile_picture = 'default.png'  

        if not student_id:
            return render_template('error.html', message="You must be logged in to view your classes"), 401
 
        # Get profile picture
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (student_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']
 
        # Updated query - Now checking for 'open' or 'ongoing' status instead of 'active'
        query = """
            SELECT 
                cl.class_id,
                cl.class_title,
                cl.schedule,
                cl.venue,
                cl.start_date,
                cl.end_date,
                cl.status,
                cl.days_of_week,
                cl.max_students,
                cl.instructor_name,
                co.course_code,
                co.course_title,
                co.course_description
            FROM enrollment e
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            WHERE e.user_id = %s 
                AND e.status = 'enrolled' 
                AND cl.status IN ('open', 'ongoing', 'completed')  -- Updated status check
            ORDER BY cl.start_date DESC
        """
        cursor.execute(query, (student_id,))
        enrolled_classes = cursor.fetchall()
 
        # Process the data
        for cls in enrolled_classes:
            # Convert dates to ISO format
            cls['start_date'] = cls['start_date'].isoformat() if cls['start_date'] else None
            cls['end_date'] = cls['end_date'].isoformat() if cls['end_date'] else None
            
            # Parse JSON days_of_week
            if cls.get('days_of_week'):
                try:
                    cls['days_of_week'] = json.loads(cls['days_of_week'])
                except (json.JSONDecodeError, TypeError):
                    cls['days_of_week'] = {}
            
            # Add status display text for better UX
            status_mapping = {
                'open': 'Open for Enrollment',
                'ongoing': 'Ongoing',
                'completed': 'Completed',
                'pending': 'Pending Approval',
                'edited': 'Edited - Pending Review'
            }
            cls['status_display'] = status_mapping.get(cls.get('status', ''), cls.get('status', 'Unknown'))

        return render_template(
            'students/student_view_class.html',
            classes=enrolled_classes,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@student_view_class_bp.route('/schedule', methods=['GET'])
def view_schedule():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        student_id = session.get('user_id')
        if not student_id:
            return jsonify({'status': 'error', 'message': 'Not logged in'}), 401

        # Updated query - filtering by 'ongoing' and 'open' classes for schedule view
        query = """
            SELECT 
                cl.class_id,
                cl.class_title,
                cl.schedule,
                cl.venue,
                cl.days_of_week,
                cl.start_date,
                cl.end_date,
                cl.status,
                co.course_code,
                co.course_title,
                cl.instructor_name
            FROM enrollment e
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses co ON cl.course_id = co.course_id
            WHERE e.user_id = %s 
                AND e.status = 'enrolled' 
                AND cl.status IN ('open', 'ongoing')  # Only show open and ongoing classes in schedule
        """
        cursor.execute(query, (student_id,))
        classes = cursor.fetchall()
 
        # Process each class
        for cls in classes:
            # Parse days_of_week JSON
            if cls.get('days_of_week'):
                try:
                    days_data = json.loads(cls['days_of_week'])
                    cls['days_of_week'] = days_data
                     
                    # Create formatted day schedules
                    cls['day_schedules'] = []
                    for day, times in days_data.items():
                        start_time = times.get('start', '00:00')
                        end_time = times.get('end', '00:00')
                         
                        # Parse times
                        start_hour = int(start_time.split(':')[0])
                        start_min = start_time.split(':')[1]
                        end_hour = int(end_time.split(':')[0])
                        end_min = end_time.split(':')[1]
                        
                        # Determine AM/PM
                        start_period = 'AM' if start_hour < 12 else 'PM'
                        end_period = 'AM' if end_hour < 12 else 'PM'
                         
                        # Convert to 12-hour format
                        display_start_hour = start_hour if start_hour <= 12 else start_hour - 12
                        if display_start_hour == 0:
                            display_start_hour = 12
                        display_end_hour = end_hour if end_hour <= 12 else end_hour - 12
                        if display_end_hour == 0:
                            display_end_hour = 12
                        
                        # Create display strings
                        display_start = f"{display_start_hour}:{start_min} {start_period}"
                        display_end = f"{display_end_hour}:{end_min} {end_period}"
                        
                        cls['day_schedules'].append({
                            'day': day,
                            'start': start_time,
                            'end': end_time,
                            'display_start': display_start,
                            'display_end': display_end,
                            'start_hour': start_hour,
                            'end_hour': end_hour
                        })
                except (json.JSONDecodeError, TypeError, AttributeError) as e:
                    cls['days_of_week'] = {}
                    cls['day_schedules'] = []
            else:
                cls['days_of_week'] = {}
                cls['day_schedules'] = []
            
            # Add status display
            status_mapping = {
                'open': 'Open',
                'ongoing': 'In Progress',
                'completed': 'Completed',
                'pending': 'Pending',
                'edited': 'Edited'
            }
            cls['status_display'] = status_mapping.get(cls.get('status', ''), cls.get('status', 'Unknown'))

        return render_template('students/student_homepage.html', classes=classes)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500