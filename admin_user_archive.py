from flask import Blueprint, render_template, request, jsonify, current_app, session
from database import get_db
from datetime import datetime

admin_user_archive_bp = Blueprint('admin_user_archive', __name__)

@admin_user_archive_bp.route('/admin_user_archive')
def show_archive_page():
    """Render the archived user page"""
    user_id = session.get('user_id')
    profile_picture = 'default.png'

    if user_id:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT profile_picture
            FROM personal_information
            WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']
    return render_template('admin/admin_user_archive.html', profile_picture=profile_picture)


@admin_user_archive_bp.route('/get_inactive_users')
def get_inactive_users():
    """Fetch inactive users for display"""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                l.user_id,
                l.username,
                l.email,
                l.role,
                l.account_status,
                CONCAT(pi.first_name, ' ', COALESCE(pi.middle_name, ''), ' ', pi.last_name) AS full_name,
                pi.contact_number,
                pi.province,
                pi.municipality,
                pi.baranggay,
                pi.date_of_birth,
                pi.gender,
                pi.date_registered
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.account_status = 'inactive'
            ORDER BY pi.date_registered DESC
        """

        cursor.execute(query)
        users = cursor.fetchall()

        # Format dates for display
        for user in users:
            if user['date_registered']:
                if isinstance(user['date_registered'], datetime):
                    user['date_registered'] = user['date_registered'].strftime('%Y-%m-%d %H:%M:%S')
                elif isinstance(user['date_registered'], str):
                    try:
                        dt = datetime.strptime(user['date_registered'], '%Y-%m-%d %H:%M:%S')
                        user['date_registered'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        user['date_registered'] = user['date_registered']

        return jsonify({'success': True, 'users': users})

    except Exception as e:
        current_app.logger.error(f"Error fetching inactive users: {str(e)}")
        return jsonify({'success': False, 'message': 'Error fetching inactive users'}), 500

    finally:
        if cursor: cursor.close()
        if db: db.close()

@admin_user_archive_bp.route('/restore_user', methods=['POST'])
def restore_user():
    """Restore an inactive user by setting account_status to active"""
    db = None
    cursor = None

    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'success': False, 'message': 'Missing user_id'}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute("START TRANSACTION")

        # Update account_status to active
        cursor.execute("""
            UPDATE login 
            SET account_status = 'active'
            WHERE user_id = %s AND account_status = 'inactive'
        """, (user_id,))

        if cursor.rowcount == 0:
            db.rollback()
            return jsonify({'success': False, 'message': 'User not found or already active'}), 404

        db.commit()

        return jsonify({
            'success': True, 
            'message': 'User restored successfully',
            'restored_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    except Exception as e:
        if db:
            db.rollback()
        current_app.logger.error(f"Error restoring user: {str(e)}")
        return jsonify({'success': False, 'message': 'Restore failed', 'error': str(e)}), 500

    finally:
        if cursor: cursor.close()
        if db: db.close()

@admin_user_archive_bp.route('/delete_user', methods=['POST'])
def delete_user():
    """Temporary delete function - does nothing for now"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'success': False, 'message': 'Missing user_id'}), 400

        # For now, just return success without doing anything
        # This is a placeholder for future implementation
        return jsonify({
            'success': True, 
            'message': 'Delete function is currently disabled (placeholder)',
            'note': 'No actual deletion performed',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    except Exception as e:
        current_app.logger.error(f"Error in delete placeholder: {str(e)}")
        return jsonify({'success': False, 'message': 'Delete operation failed', 'error': str(e)}), 500