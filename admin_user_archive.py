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


@admin_user_archive_bp.route('/get_archived_users_hierarchy')
def get_archived_users_hierarchy():
    """Fetch archived users organized by year and month"""
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
                pi.date_registered,
                YEAR(pi.date_registered) as reg_year,
                MONTH(pi.date_registered) as reg_month,
                DATE_FORMAT(pi.date_registered, '%M %Y') as formatted_date
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.account_status = 'inactive'
            ORDER BY pi.date_registered DESC
        """

        cursor.execute(query)
        users = cursor.fetchall()
 
        hierarchy = {}
        
        for user in users: 
            if user['date_registered']:
                if isinstance(user['date_registered'], datetime):
                    user['date_registered_display'] = user['date_registered'].strftime('%Y-%m-%d %H:%M:%S')
                    user['date_registered_short'] = user['date_registered'].strftime('%b %d, %Y')
                elif isinstance(user['date_registered'], str):
                    try:
                        dt = datetime.strptime(user['date_registered'], '%Y-%m-%d %H:%M:%S')
                        user['date_registered_display'] = dt.strftime('%Y-%m-%d %H:%M:%S')
                        user['date_registered_short'] = dt.strftime('%b %d, %Y')
                    except ValueError:
                        user['date_registered_display'] = user['date_registered']
                        user['date_registered_short'] = user['date_registered']
            
            year = user['reg_year']
            month = user['reg_month']
             
            if year not in hierarchy:
                hierarchy[year] = {
                    'year': year,
                    'month_count': 0,
                    'user_count': 0,
                    'months': {}
                }
             
            if month not in hierarchy[year]['months']:
                month_names = {
                    1: 'January', 2: 'February', 3: 'March', 4: 'April',
                    5: 'May', 6: 'June', 7: 'July', 8: 'August',
                    9: 'September', 10: 'October', 11: 'November', 12: 'December'
                }
                hierarchy[year]['months'][month] = {
                    'month_number': month,
                    'month_name': month_names.get(month, 'Unknown'),
                    'user_count': 0,
                    'users': []
                }
                hierarchy[year]['month_count'] += 1
             
            hierarchy[year]['months'][month]['users'].append(user)
            hierarchy[year]['months'][month]['user_count'] += 1
            hierarchy[year]['user_count'] += 1
         
        years_list = []
        for year in sorted(hierarchy.keys(), reverse=True):  
            year_data = hierarchy[year]
            months_list = []
             
            for month_num in sorted(year_data['months'].keys(), reverse=True):
                months_list.append(year_data['months'][month_num])
            
            years_list.append({
                'year': year_data['year'],
                'month_count': year_data['month_count'],
                'user_count': year_data['user_count'],
                'months': months_list
            })
        
        return jsonify({
            'success': True, 
            'years': years_list,
            'total_users': sum(year['user_count'] for year in years_list)
        })

    except Exception as e:
        current_app.logger.error(f"Error fetching archived users hierarchy: {str(e)}")
        return jsonify({'success': False, 'message': 'Error fetching archived users'}), 500

    finally:
        if cursor: cursor.close()
        if db: db.close()


@admin_user_archive_bp.route('/restore_user', methods=['POST'])
def restore_user():
    """Restore an archived user by setting account_status to active"""
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