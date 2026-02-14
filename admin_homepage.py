from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from database import get_db
from datetime import datetime, timedelta

admin_homepage_bp = Blueprint('admin_homepage', __name__)

@admin_homepage_bp.route('/admin/dashboard')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))
     
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT pi.profile_picture 
            FROM personal_information pi 
            WHERE pi.user_id = %s
        """, (session['user_id'],))
        result = cursor.fetchone()
        profile_picture = result[0] if result else None
    except Exception as e:
        profile_picture = None
    finally:
        cursor.close()
    
    return render_template('admin/dashboard.html', profile_picture=profile_picture)

@admin_homepage_bp.route('/admin/dashboard/data')
def dashboard_data():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor()
    
    try: 
        cursor.execute("SELECT COUNT(*) FROM courses WHERE course_status = 'active'")
        total_courses = cursor.fetchone()[0]
         
        cursor.execute("SELECT COUNT(*) FROM classes WHERE status = 'active'")
        total_classes = cursor.fetchone()[0]
         
        cursor.execute("SELECT COUNT(*) FROM login WHERE role = 'student' AND account_status = 'active'")
        total_students = cursor.fetchone()[0]
         
        cursor.execute("SELECT COUNT(*) FROM login WHERE role = 'staff' AND account_status = 'active'")
        total_staff = cursor.fetchone()[0]
         
        cursor.execute("SELECT COUNT(*) FROM enrollment WHERE status = 'enrolled'")
        total_enrollments = cursor.fetchone()[0]
         
        cursor.execute("SELECT COUNT(*) FROM courses WHERE course_status = 'pending'")
        pending_courses = cursor.fetchone()[0]
         
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute("SELECT COUNT(*) FROM certificates WHERE created_at >= %s", (week_ago,))
        recent_certificates = cursor.fetchone()[0]
         
        cursor.execute("""
            SELECT 
                COUNT(*) as total_classes,
                SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) as completed_classes
            FROM classes 
            WHERE status = 'active'
        """)
        class_stats = cursor.fetchone()
        total_active_classes = class_stats[0]
        completed_classes = class_stats[1]
        completion_rate = round((completed_classes / total_active_classes * 100), 2) if total_active_classes > 0 else 0
         
        cursor.execute("""
            SELECT 
                CONCAT(pi.first_name, ' ', pi.last_name) as student_name,
                c.course_title,
                cl.class_title,
                e.enrollment_date
            FROM enrollment e
            JOIN login l ON e.user_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            JOIN classes cl ON e.class_id = cl.class_id
            JOIN courses c ON cl.course_id = c.course_id
            WHERE e.status = 'enrolled'
            ORDER BY e.enrollment_date DESC
            LIMIT 5
        """)
        recent_enrollments = cursor.fetchall()
         
        cursor.execute("""
            SELECT 
                c.course_title,
                COUNT(e.enrollment_id) as enrollment_count
            FROM courses c
            LEFT JOIN classes cl ON c.course_id = cl.course_id
            LEFT JOIN enrollment e ON cl.class_id = e.class_id AND e.status = 'enrolled'
            WHERE c.course_status = 'active'
            GROUP BY c.course_id, c.course_title
            ORDER BY enrollment_count DESC
            LIMIT 5
        """)
        popular_courses = cursor.fetchall()
        
        return jsonify({
            'total_courses': total_courses,
            'total_classes': total_classes,
            'total_students': total_students,
            'total_staff': total_staff,
            'total_enrollments': total_enrollments,
            'pending_courses': pending_courses,
            'recent_certificates': recent_certificates,
            'completion_rate': completion_rate,
            'recent_enrollments': [
                {
                    'student_name': row[0],
                    'course_title': row[1],
                    'class_title': row[2],
                    'enrollment_date': row[3].strftime('%Y-%m-%d %H:%M') if row[3] else ''
                }
                for row in recent_enrollments
            ],
            'popular_courses': [
                {
                    'course_title': row[0],
                    'enrollment_count': row[1]
                }
                for row in popular_courses
            ]
        })
    
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()