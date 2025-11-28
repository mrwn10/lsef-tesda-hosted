from flask import Blueprint, render_template, request, jsonify, current_app, session
from datetime import datetime
from database import get_db
import logging

admin_user_deletion_bp = Blueprint('admin_user_deletion', __name__)

@admin_user_deletion_bp.route('/admin_user_deletion')
def show_deletion_page():
    """Render the user deletion page"""
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
        cursor.close()
    return render_template('admin/admin_user_deletion.html', profile_picture=profile_picture)


def fetch_active_users(search_query=None, role_filter='all'):
    """Fetch all active users (staff and student only) with optional filtering"""
    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                l.user_id, l.username, l.email, l.role, l.account_status,
                pi.first_name, pi.middle_name, pi.last_name,
                pi.contact_number, pi.date_registered
            FROM login l
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.account_status = 'active' AND l.role IN ('staff', 'student')
        """
        params = []

        # Add search conditions if provided
        if search_query and search_query.strip():
            query += """
                AND (
                    l.username LIKE %s OR
                    l.email LIKE %s OR
                    pi.first_name LIKE %s OR
                    pi.middle_name LIKE %s OR
                    pi.last_name LIKE %s
                )
            """
            search_pattern = f'%{search_query}%'
            params.extend([search_pattern] * 5)

        # Add role filter if specified
        if role_filter and role_filter.lower() in ['staff', 'student']:
            query += " AND l.role = %s"
            params.append(role_filter)

        query += " ORDER BY pi.first_name, pi.last_name"

        cursor.execute(query, params)
        users = cursor.fetchall()

        return {
            'success': True,
            'users': users,
            'count': len(users)
        }

    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return {
            'success': False,
            'message': 'Error fetching users',
            'error': str(e)
        }

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@admin_user_deletion_bp.route('/get_active_users')
def get_active_users():
    """Get all active users with optional search and filtering"""
    search_query = request.args.get('q', '').strip()
    role_filter = request.args.get('role', 'all')
    
    result = fetch_active_users(search_query, role_filter)
    status_code = 200 if result['success'] else 500
    return jsonify(result), status_code


@admin_user_deletion_bp.route('/delete_user', methods=['POST'])
def delete_user():
    """
    Endpoint to delete an active user account.
    Moves all user data to archive table before deletion.
    Only works for accounts with 'active' status.
    """
    db = None
    cursor = None
    user_id = None
    
    try:
        # Check if request has JSON data
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Request must be JSON'
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No JSON data provided'
            }), 400
            
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Missing required parameter: user_id is required'
            }), 400

        # Validate user_id format
        try:
            user_id = int(user_id)
            if user_id <= 0:
                raise ValueError("ID must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'Invalid ID format - must be positive integer'
            }), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("START TRANSACTION")

        # Check if user exists and get current status
        cursor.execute("""
            SELECT user_id, account_status, role 
            FROM login 
            WHERE user_id = %s
            FOR UPDATE
        """, (user_id,))
        user_status = cursor.fetchone()

        if not user_status:
            db.rollback()
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        if user_status['account_status'] != 'active':
            db.rollback()
            return jsonify({
                'success': False,
                'message': f'Only active users can be deleted. Current status: {user_status["account_status"]}',
                'current_status': user_status['account_status']
            }), 400

        if user_status['role'] not in ['staff', 'student']:
            db.rollback()
            return jsonify({
                'success': False,
                'message': 'Only staff or student accounts can be deleted through this endpoint'
            }), 400

        # Get complete user data for archiving
        cursor.execute("""
            SELECT 
                l.user_id, l.username, l.password, l.email, l.role, l.account_status,
                pi.province, pi.municipality, pi.baranggay, pi.contact_number,
                pi.first_name, pi.middle_name, pi.last_name, pi.date_of_birth, pi.gender,
                pi.profile_picture, pi.terms_accepted, pi.date_registered
            FROM login l
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id = %s
        """, (user_id,))
        user_data = cursor.fetchone()

        if not user_data:
            db.rollback()
            return jsonify({
                'success': False,
                'message': 'User data incomplete - cannot archive'
            }), 400

        # Archive user data
        cursor.execute("""
            INSERT INTO user_archived (
                original_user_id, username, password, email, role, account_status,
                province, municipality, baranggay, contact_number,
                first_name, middle_name, last_name, date_of_birth, gender,
                profile_picture, terms_accepted, date_registered,
                date_archived
            ) VALUES (
                %(user_id)s, %(username)s, %(password)s, %(email)s, %(role)s, %(account_status)s,
                %(province)s, %(municipality)s, %(baranggay)s, %(contact_number)s,
                %(first_name)s, %(middle_name)s, %(last_name)s, %(date_of_birth)s, %(gender)s,
                %(profile_picture)s, %(terms_accepted)s, %(date_registered)s,
                NOW()
            )
        """, user_data)

        # Delete user data
        cursor.execute("DELETE FROM personal_information WHERE user_id = %s", (user_id,))
        rows_affected_pi = cursor.rowcount
        
        cursor.execute("DELETE FROM login WHERE user_id = %s", (user_id,))
        rows_affected_login = cursor.rowcount

        if rows_affected_pi == 0 or rows_affected_login == 0:
            db.rollback()
            return jsonify({
                'success': False,
                'message': 'No records were deleted - possible data inconsistency'
            }), 400

        db.commit()
        
        current_app.logger.info(
            f"User {user_id} ({user_data['email']}) archived and deleted successfully"
        )

        return jsonify({
            'success': True,
            'message': 'User successfully deleted and archived',
            'archived_user_id': user_id,
            'archived_at': datetime.now().isoformat()
        })

    except Exception as e:
        if db:
            db.rollback()
        current_app.logger.error(
            f"Failed to delete user {user_id}: {str(e)}", 
            exc_info=True,
            extra={'user_id': user_id}
        )
        return jsonify({
            'success': False,
            'message': 'An error occurred while deleting the user',
            'error': str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@admin_user_deletion_bp.route('/search_users')
def search_users():
    """Search users endpoint - now integrated with get_active_users"""
    search_query = request.args.get('q', '').strip()
    role_filter = request.args.get('role', 'all').lower()
    
    result = fetch_active_users(search_query, role_filter)
    status_code = 200 if result['success'] else 500
    return jsonify(result), status_code