from flask import Blueprint, render_template, request, jsonify, session
from database import get_db

student_view_grades_bp = Blueprint('student_view_grades', __name__)

@student_view_grades_bp.route('/student/view_grades', methods=['GET'])
def view_grades(): 
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized access'}), 403

    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Fetch profile picture
    profile_picture = 'default.png'   
    cursor.execute("""
        SELECT profile_picture
        FROM personal_information
        WHERE user_id = %s
    """, (user_id,))
    user = cursor.fetchone()
    if user and user.get('profile_picture'):
        profile_picture = user['profile_picture']
 
    query = """
        SELECT 
            co.course_code,
            co.course_title,
            c.class_title,
            sg.prelim_grade,
            sg.midterm_grade,
            sg.final_grade,
            sg.remarks,
            e.status,
            e.enrollment_id,
            c.class_id
        FROM enrollment e
        JOIN classes c ON e.class_id = c.class_id
        JOIN courses co ON c.course_id = co.course_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE e.user_id = %s 
        AND (e.status = 'completed' OR e.status = 'enrolled')
    """
    cursor.execute(query, (user_id,))
    all_grades = cursor.fetchall()
    
    # Calculate statistics
    completed_courses = 0
    ongoing_courses = 0
    total_final_grade = 0
    completed_with_grades = 0
    
    completed_courses_list = []
    ongoing_courses_list = []
    
    for grade in all_grades:
        if grade['remarks'] == 'Competent':
            completed_courses += 1
            completed_courses_list.append(grade)
             
            if grade['final_grade']:
                total_final_grade += float(grade['final_grade'])
                completed_with_grades += 1
        else:
            ongoing_courses += 1
            ongoing_courses_list.append(grade)
     
    average_grade = round(total_final_grade / completed_with_grades, 2) if completed_with_grades > 0 else 'N/A'
     
    grades_for_display = all_grades
     
    completed_courses_data = completed_courses_list

    if not all_grades:
        return render_template('students/student_view_grades.html',
                               grades=None,
                               completed_courses_data=None,
                               completed_courses=completed_courses,
                               ongoing_courses=ongoing_courses,
                               average_grade=average_grade,
                               message="No grades available yet.",
                               profile_picture=profile_picture)

    return render_template('students/student_view_grades.html',
                           grades=grades_for_display,
                           completed_courses_data=completed_courses_data,
                           completed_courses=completed_courses,
                           ongoing_courses=ongoing_courses,
                           average_grade=average_grade,
                           profile_picture=profile_picture)


@student_view_grades_bp.route('/student/get_final_average', methods=['GET'])
def get_final_average():
    """API endpoint to get final average for a specific class"""
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    class_id = request.args.get('class_id')
    if not class_id:
        return jsonify({'error': 'Class ID is required'}), 400
    
    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    query = """
        SELECT 
            sg.final_grade,
            c.class_title,
            co.course_title,
            sg.remarks
        FROM enrollment e
        JOIN classes c ON e.class_id = c.class_id
        JOIN courses co ON c.course_id = co.course_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE e.user_id = %s 
        AND c.class_id = %s
        AND sg.remarks = 'Competent'
    """
    
    cursor.execute(query, (user_id, class_id))
    result = cursor.fetchone()
    
    if result:
        return jsonify({
            'success': True,
            'class_title': result['class_title'],
            'course_title': result['course_title'],
            'final_average': result['final_grade'],
            'remarks': result['remarks']
        })
    else:
        return jsonify({
            'success': False,
            'message': 'No competent grade found for this class'
        }), 404