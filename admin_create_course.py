from flask import Blueprint, request, jsonify, render_template, flash, url_for, redirect, session
from database import get_db
from datetime import datetime

admin_create_course_bp = Blueprint('admin_create_course', __name__)

@admin_create_course_bp.route('/admin/create_course', methods=['GET'])
def show_create_course_form():
    """Render the course creation form for admin"""
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    db = get_db()
    cursor = db.cursor(dictionary=True)

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
    except Exception:
        profile_picture = 'default.png'
    finally:
        cursor.close()

    return render_template(
        'admin/admin_create_course.html',
        profile_picture=profile_picture
    )


@admin_create_course_bp.route('/admin/create_course', methods=['POST'])
def create_course():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

    data = request.get_json()

    # Required fields
    required_fields = [
        'course_code', 'course_title', 'course_description', 'course_category',
        'target_audience', 'duration_hours', 'created_by'
    ]

    # Check for missing required fields
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == '':
            return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400

    # Optional fields
    prerequisites = data.get('prerequisites', None)
    learning_outcomes = data.get('learning_outcomes', None)
    max_students = data.get('max_students', None)
    course_fee = data.get('course_fee', 0.00)
    published = data.get('published', 0)  # Default to draft (0)

    # Admin can directly approve the course
    course_status = 'active'
    date_created = datetime.now()
    date_published = datetime.now() if published else None

    try:
        db = get_db()
        cursor = db.cursor()

        query = """
            INSERT INTO courses (
                course_code, course_title, course_description, course_category,
                target_audience, prerequisites, learning_outcomes, duration_hours,
                course_fee, max_students, course_status, published, created_by, 
                date_created, date_published
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
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
            course_status,
            published,
            data['created_by'],
            date_created,
            date_published
        )

        cursor.execute(query, values)
        db.commit()

        return jsonify({
            'status': 'success', 
            'message': 'Course created and approved successfully.'
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500