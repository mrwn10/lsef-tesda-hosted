from flask import Blueprint, render_template, request, jsonify, session
from datetime import datetime
from database import get_db

staff_class_management_bp = Blueprint('staff_class_management', __name__)

@staff_class_management_bp.route('/staff_class_management', methods=['GET'])
def view_active_classes():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Get the instructor_id from session
        instructor_id = session.get('user_id')
        if not instructor_id:
            return render_template('error.html', message="You must be logged in to view classes"), 401

        # Fetch profile picture
        profile_picture = 'default.png'
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (instructor_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']

        # Fetch only 'active' or 'edited' classes created by this staff
        query = """
            SELECT 
                cl.class_id, cl.class_title, cl.schedule, cl.venue, cl.max_students, cl.prerequisites,
                cl.start_date, cl.end_date, cl.status, cl.date_created,
                co.course_title
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            JOIN login l ON cl.instructor_id = l.user_id
            WHERE cl.status IN ('active', 'edited') AND l.role = 'staff' AND cl.instructor_id = %s
            ORDER BY cl.date_created DESC
        """
        cursor.execute(query, (instructor_id,))
        active_classes = cursor.fetchall()

        # Convert date objects to ISO strings for JSON compatibility
        for cls in active_classes:
            cls['start_date'] = cls['start_date'].isoformat() if cls['start_date'] else None
            cls['end_date'] = cls['end_date'].isoformat() if cls['end_date'] else None

        return render_template(
            'staffs/staff_class_management.html',
            classes=active_classes,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
