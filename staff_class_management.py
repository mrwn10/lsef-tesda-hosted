# staff_class_management.py - Updated Flask route to show all classes
from flask import Blueprint, render_template, request, jsonify, session
from datetime import datetime
from database import get_db

staff_class_management_bp = Blueprint('staff_class_management', __name__)

@staff_class_management_bp.route('/staff_class_management', methods=['GET'])
def view_active_classes():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
 
        instructor_id = session.get('user_id')
        if not instructor_id:
            return render_template('error.html', message="You must be logged in to view classes"), 401
 
        profile_picture = 'default.png'
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (instructor_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']
 
        query = """
            SELECT 
                cl.class_id, 
                cl.class_title, 
                cl.schedule, 
                cl.venue, 
                cl.max_students, 
                cl.prerequisites,
                cl.start_date, 
                cl.end_date, 
                cl.status, 
                cl.date_created,
                co.course_title,
                cl.instructor_name,
                cl.batch,
                cl.school_year,
                -- Count enrolled students for each class
                COUNT(e.enrollment_id) as current_students,
                -- Calculate available slots (max_students minus enrolled students)
                cl.max_students - COUNT(e.enrollment_id) as available_slots
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            JOIN login l ON cl.instructor_id = l.user_id
            LEFT JOIN enrollment e ON cl.class_id = e.class_id 
                AND e.status IN ('enrolled', 'completed')  -- Only count active/completed enrollments
            WHERE l.role = 'staff' 
                AND cl.instructor_id = %s
            GROUP BY cl.class_id, cl.class_title, cl.schedule, cl.venue, 
                     cl.max_students, cl.prerequisites, cl.start_date, 
                     cl.end_date, cl.status, cl.date_created, co.course_title,
                     cl.instructor_name, cl.batch, cl.school_year
            ORDER BY 
                CASE cl.status
                    WHEN 'ongoing' THEN 1
                    WHEN 'open' THEN 2
                    WHEN 'edited' THEN 3
                    WHEN 'pending' THEN 4
                    WHEN 'completed' THEN 5
                    ELSE 6
                END,
                cl.start_date ASC
        """
        cursor.execute(query, (instructor_id,))
        all_classes = cursor.fetchall()
 
        for cls in all_classes: 
            cls['start_date'] = cls['start_date'].isoformat() if cls['start_date'] else None
            cls['end_date'] = cls['end_date'].isoformat() if cls['end_date'] else None
             
            cls['current_students'] = int(cls['current_students']) if cls['current_students'] else 0
            cls['available_slots'] = int(cls['available_slots']) if cls['available_slots'] else cls['max_students']
             
            status = cls['status']
            if status == 'ongoing':
                cls['status_badge'] = 'badge bg-primary'
                cls['status_text'] = 'Ongoing'
            elif status == 'open':
                cls['status_badge'] = 'badge bg-success'
                cls['status_text'] = 'Open for Enrollment'
            elif status == 'edited':
                cls['status_badge'] = 'badge bg-warning text-dark'
                cls['status_text'] = 'Edited'
            elif status == 'completed':
                cls['status_badge'] = 'badge bg-secondary'
                cls['status_text'] = 'Completed'
            elif status == 'pending':
                cls['status_badge'] = 'badge bg-info'
                cls['status_text'] = 'Pending Approval'
            else:
                cls['status_badge'] = 'badge bg-light text-dark'
                cls['status_text'] = status
             
            if cls['start_date']:
                start_date = datetime.fromisoformat(cls['start_date'].replace('Z', '+00:00'))
                cls['formatted_start_date'] = start_date.strftime('%B %d, %Y')
            
            if cls['end_date']:
                end_date = datetime.fromisoformat(cls['end_date'].replace('Z', '+00:00'))
                cls['formatted_end_date'] = end_date.strftime('%B %d, %Y')

        return render_template(
            'staffs/staff_class_management.html',
            classes=all_classes,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@staff_class_management_bp.route('/api/class/<int:class_id>', methods=['GET'])
def get_class_details(class_id):
    """API endpoint to get specific class details"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
         
        instructor_id = session.get('user_id')
        if not instructor_id:
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
        
        query = """
            SELECT 
                cl.*,
                co.course_title,
                co.course_code,
                co.course_description,
                COUNT(e.enrollment_id) as enrolled_students
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            LEFT JOIN enrollment e ON cl.class_id = e.class_id 
                AND e.status IN ('enrolled', 'completed')
            WHERE cl.class_id = %s AND cl.instructor_id = %s
            GROUP BY cl.class_id
        """
        
        cursor.execute(query, (class_id, instructor_id))
        class_data = cursor.fetchone()
        
        if not class_data:
            return jsonify({'status': 'error', 'message': 'Class not found or unauthorized'}), 404
         
        if class_data.get('days_of_week'):
            import json
            try:
                class_data['days_of_week'] = json.loads(class_data['days_of_week'])
            except:
                class_data['days_of_week'] = None
        
        return jsonify({'status': 'success', 'class': class_data})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@staff_class_management_bp.route('/api/class/<int:class_id>/students', methods=['GET'])
def get_class_students(class_id):
    """API endpoint to get students enrolled in a specific class"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
         
        instructor_id = session.get('user_id')
        if not instructor_id:
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
         
        cursor.execute("""
            SELECT 1 FROM classes 
            WHERE class_id = %s AND instructor_id = %s
        """, (class_id, instructor_id))
        
        if not cursor.fetchone():
            return jsonify({'status': 'error', 'message': 'Unauthorized to view this class'}), 403
         
        query = """
            SELECT 
                e.enrollment_id,
                e.enrollment_date,
                e.status as enrollment_status,
                l.user_id,
                l.username,
                l.email,
                pi.first_name,
                pi.last_name,
                pi.middle_name,
                sg.prelim_grade,
                sg.midterm_grade,
                sg.final_grade,
                sg.remarks
            FROM enrollment e
            JOIN login l ON e.user_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.class_id = %s
            ORDER BY pi.last_name, pi.first_name
        """
        
        cursor.execute(query, (class_id,))
        students = cursor.fetchall()
         
        for student in students:
            if student.get('enrollment_date'):
                student['enrollment_date'] = student['enrollment_date'].isoformat()
        
        return jsonify({'status': 'success', 'students': students})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500