from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for, flash
from datetime import datetime
from database import get_db
import json

admin_edit_course_bp = Blueprint('admin_edit_course', __name__)

@admin_edit_course_bp.route('/admin/edit_course', methods=['GET'])
def view_editable_courses():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
 
        query = """
            SELECT 
                course_id, course_code, course_title, course_description,
                course_category, target_audience, prerequisites,
                learning_outcomes, duration_hours, course_fee,
                max_students, course_status, published
            FROM courses
            WHERE course_status = 'active'
            ORDER BY date_created DESC
        """
        cursor.execute(query)
        courses = cursor.fetchall()
 
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
            'admin/admin_edit_course.html',
            courses=courses,
            profile_picture=profile_picture
        )

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_edit_course_bp.route('/admin/course/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                course_id, course_code, course_title, course_description,
                course_category, target_audience, prerequisites,
                learning_outcomes, duration_hours, course_fee,
                max_students, course_status, published
            FROM courses
            WHERE course_id = %s
        """
        cursor.execute(query, (course_id,))
        course = cursor.fetchone()

        if not course:
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404

        return jsonify({'status': 'success', 'course': course})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_edit_course_bp.route('/admin/update_course/<int:course_id>', methods=['POST'])
def update_course(course_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        data = request.get_json()
 
        required_fields = [
            'course_code', 'course_title', 'course_description', 'course_category',
            'target_audience', 'duration_hours'
        ]
 
        for field in required_fields:
            if field not in data or data[field] is None or str(data[field]).strip() == '':
                return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400
 
        prerequisites = data.get('prerequisites', None)
        learning_outcomes = data.get('learning_outcomes', None)
        max_students = data.get('max_students', None)
        course_fee = data.get('course_fee', 0.00)
        published = data.get('published', 0)   

        update_query = """
            UPDATE courses
            SET 
                course_code = %s,
                course_title = %s,
                course_description = %s,
                course_category = %s,
                target_audience = %s,
                prerequisites = %s,
                learning_outcomes = %s,
                duration_hours = %s,
                course_fee = %s,
                max_students = %s,
                published = %s,
                date_updated = %s
            WHERE course_id = %s
        """

        now = datetime.now()
        cursor.execute(update_query, (
            data['course_code'],
            data['course_title'],
            data['course_description'],
            data['course_category'],
            data['target_audience'],
            prerequisites,
            learning_outcomes,
            data['duration_hours'],
            course_fee,
            max_students,
            published,
            now,
            course_id
        ))
        db.commit()

        return jsonify({
            'status': 'success',
            'message': 'Course updated successfully'
        })

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500