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

        # Updated query to fetch all necessary fields
        query = """
            SELECT 
                cl.class_id, 
                cl.class_title, 
                cl.schedule, 
                cl.venue, 
                cl.max_students,
                cl.start_date, 
                cl.end_date, 
                cl.status, 
                cl.date_created,
                cl.batch,
                cl.school_year,
                cl.days_of_week,
                cl.prerequisites,
                cl.instructor_name,
                co.course_title,
                co.course_code,
                pi.first_name, 
                pi.last_name,
                -- Count enrolled students
                COUNT(e.enrollment_id) as enrolled_count
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            JOIN login l ON cl.instructor_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN enrollment e ON cl.class_id = e.class_id 
                AND e.status IN ('enrolled', 'completed')
            WHERE cl.status = 'pending'
            GROUP BY cl.class_id
            ORDER BY cl.date_created DESC
        """
        cursor.execute(query)
        pending_classes = cursor.fetchall()

        # Format dates for JSON serialization
        for cls in pending_classes:
            if cls.get('start_date'):
                cls['start_date'] = cls['start_date'].isoformat() if hasattr(cls['start_date'], 'isoformat') else str(cls['start_date'])
            if cls.get('end_date'):
                cls['end_date'] = cls['end_date'].isoformat() if hasattr(cls['end_date'], 'isoformat') else str(cls['end_date'])
            
            # Parse days_of_week if it's a string
            if cls.get('days_of_week') and isinstance(cls['days_of_week'], str):
                import json
                try:
                    cls['days_of_week'] = json.loads(cls['days_of_week'])
                except:
                    cls['days_of_week'] = {}

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
        print(f"Error in view_pending_classes: {e}")
        import traceback
        traceback.print_exc()
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

        new_status = 'open' if action == 'approve' else 'rejected'  # Changed from 'pending' to 'rejected'
        now = datetime.now()

        update_query = """
            UPDATE classes
            SET status = %s, date_updated = %s
            WHERE class_id = %s
        """
        cursor.execute(update_query, (new_status, now, class_id))
        db.commit()

        return jsonify({
            'status': 'success', 
            'message': f'Class has been {action}d successfully.'
        })

    except Exception as e:
        db.rollback()
        print(f"Error in approve_or_reject_class: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500