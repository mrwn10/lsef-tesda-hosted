from flask import Blueprint, render_template, request, jsonify, session, url_for, flash, redirect
from datetime import datetime
from database import get_db

admin_class_approval_bp = Blueprint('admin_class_approval', __name__)

@admin_class_approval_bp.route('/class_approval', methods=['GET'])
def view_pending_classes():
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
                co.course_title,
                pi.first_name, pi.last_name
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            JOIN login l ON cl.instructor_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE cl.status = 'pending'  -- Changed from 'Pending' to 'pending' (lowercase)
            ORDER BY cl.date_created DESC
        """
        cursor.execute(query)
        pending_classes = cursor.fetchall()

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
            'admin/admin_class_approval.html',
            classes=pending_classes,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_class_approval_bp.route('/approval_action', methods=['POST'])
def approve_or_reject_class():
    try:
        db = get_db()
        cursor = db.cursor()

        data = request.get_json()
        class_id = data.get('class_id')
        action = data.get('action')  

        if not class_id or action not in ['approve', 'reject']:
            return jsonify({'status': 'error', 'message': 'Invalid data provided.'}), 400

        new_status = 'open' if action == 'approve' else 'pending'
        now = datetime.now()

        update_query = """
            UPDATE classes
            SET status = %s, date_updated = %s
            WHERE class_id = %s
        """
        cursor.execute(update_query, (new_status, now, class_id))
        db.commit()

        return jsonify({'status': 'success', 'message': f'Class has been {action}d.'})

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500