from flask import Blueprint, request, jsonify, session, render_template
from database import get_db
import json

staff_homepage_bp = Blueprint('staff_homepage', __name__)

@staff_homepage_bp.route('/students', methods=['GET'])
def get_all_students():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                l.user_id, l.username, l.email, l.role, l.account_status,
                pi.first_name, pi.middle_name, pi.last_name,
                pi.contact_number, pi.province, pi.municipality, pi.baranggay,
                pi.profile_picture
            FROM login l
            LEFT JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.role = 'student'
            ORDER BY l.account_status, pi.last_name
        """)

        students = cursor.fetchall()
        
        if not students:
            return jsonify({
                'success': False,
                'error': 'No student accounts found',
                'data': []
            })
        
        # Get additional data for each student
        for student in students:
            user_id = student['user_id']
            
            # Get enrollments
            cursor.execute("""
                SELECT e.enrollment_id, e.status,
                       c.class_id, c.class_title, c.schedule, c.venue,
                       co.course_id, co.course_title, co.course_code
                FROM enrollment e
                LEFT JOIN classes c ON e.class_id = c.class_id
                LEFT JOIN courses co ON c.course_id = co.course_id
                WHERE e.user_id = %s
            """, (user_id,))
            enrollments = cursor.fetchall()
            student['enrollments'] = enrollments
            
            # Get grades for each enrollment
            for enrollment in enrollments:
                if enrollment['enrollment_id']:
                    cursor.execute("""
                        SELECT prelim_grade, midterm_grade, final_grade, remarks
                        FROM student_grades
                        WHERE enrollment_id = %s
                    """, (enrollment['enrollment_id'],))
                    grades = cursor.fetchone()
                    enrollment['grades'] = grades if grades else None
            
            # Get certificates
            cursor.execute("""
                SELECT cert.id, cert.course, cert.date, 
                       cert.cert_hash, cert.tx_hash, cert.file_path,
                       c.class_title
                FROM certificates cert
                LEFT JOIN enrollment e ON cert.enrollment_id = e.enrollment_id
                LEFT JOIN classes c ON e.class_id = c.class_id
                WHERE e.user_id = %s
            """, (user_id,))
            certificates = cursor.fetchall()
            student['certificates'] = certificates
        
        return jsonify({
            'success': True,
            'data': students,
            'count': len(students)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500
    

