from flask import Blueprint, render_template, request, jsonify, session, flash, redirect, url_for
from datetime import datetime
from database import get_db

admin_class_management_bp = Blueprint('admin_class_management', __name__)

@admin_class_management_bp.route('/class_management', methods=['GET'])
def view_active_classes():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # --- Fetch active classes ---
    query = """
        SELECT 
            cl.class_id, cl.class_title, cl.schedule, cl.venue, cl.max_students,
            cl.start_date, cl.end_date, cl.status, cl.date_created, cl.instructor_name,
            co.course_title,
            pi.first_name, pi.last_name
        FROM classes cl
        JOIN courses co ON cl.course_id = co.course_id
        JOIN login l ON cl.instructor_id = l.user_id
        JOIN personal_information pi ON l.user_id = pi.user_id
        WHERE cl.status = 'active'
        ORDER BY cl.date_created DESC
    """
    cursor.execute(query)
    active_classes = cursor.fetchall()

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
    except Exception as e:
        profile_picture = 'default.png'

    cursor.close()

    return render_template(
        'admin/admin_class_management.html',
        classes=active_classes,
        profile_picture=profile_picture
    )
