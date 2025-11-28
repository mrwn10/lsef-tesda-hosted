from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from datetime import datetime, date
from database import get_db
import logging

student_enrollment_bp = Blueprint('student_enrollment', __name__, url_prefix='/student')


# -----------------------------
# ENROLLMENT PAGE
# -----------------------------
@student_enrollment_bp.route('/enrollment', methods=['GET'])
def enrollment_page():
    if 'user_id' not in session or session.get('role') != 'student':
        flash("Unauthorized access. Please log in as a student.", "error")
        return redirect(url_for('auth.login'))

    db = get_db()
    cursor = db.cursor(dictionary=True)
    user_id = session['user_id']
    profile_picture = 'default.png'

    try:
        # 🔹 Verify student status
        cursor.execute("SELECT account_status, verified FROM login WHERE user_id = %s", (user_id,))
        student = cursor.fetchone()

        if not student:
            flash("User not found.", "error")
            return redirect(url_for('auth.login'))

        if student['account_status'] != 'active' or student['verified'] != 'verified':
            flash("You must upload the required documents to be verified before enrolling.", "warning")
            return redirect(url_for('student_requirements.upload_requirements'))

        # 🔹 Fetch profile picture
        cursor.execute("SELECT profile_picture FROM personal_information WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        if row and row.get('profile_picture'):
            profile_picture = row['profile_picture']

        # ✅ Fix timezone issue
        today = date.today().strftime("%Y-%m-%d")

        # ✅ Updated query to show ongoing and upcoming classes
        query = """
            SELECT 
                cl.class_id, 
                cl.class_title, 
                cl.schedule, 
                cl.venue, 
                cl.max_students,
                cl.start_date, 
                cl.end_date,
                cl.instructor_name,
                cl.days_of_week,
                co.course_id,
                co.course_title, 
                co.course_description, 
                co.course_category, 
                co.learning_outcomes, 
                co.course_fee, 
                co.prerequisites AS course_prerequisites,
                co.duration_hours,
                (cl.max_students - COALESCE((
                    SELECT COUNT(*) 
                    FROM enrollment 
                    WHERE class_id = cl.class_id 
                    AND status IN ('enrolled', 'pending')
                ), 0)) AS available_slots
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            WHERE cl.status = 'active'
              AND co.course_status = 'active'
              AND cl.end_date >= %s
            HAVING available_slots > 0
            ORDER BY co.course_title, cl.class_title
        """
        cursor.execute(query, (today,))
        classes = cursor.fetchall()

        # 🔹 Fetch enrolled classes
        cursor.execute("""
            SELECT class_id, status 
            FROM enrollment 
            WHERE user_id = %s AND status IN ('pending', 'enrolled', 'completed')
        """, (user_id,))
        enrolled = cursor.fetchall()
        enrolled_classes = [e['class_id'] for e in enrolled]

        # 🔹 Check if currently enrolled
        cursor.execute("SELECT COUNT(*) AS total FROM enrollment WHERE user_id = %s AND status = 'enrolled'", (user_id,))
        result = cursor.fetchone()
        has_current_enrollment = result['total'] > 0 if result else False

        logging.info(f"[Enrollment Page] Found {len(classes)} available classes for user {user_id}")

        return render_template(
            'students/student_enrollment.html',
            classes=classes,
            enrolled_classes=enrolled_classes,
            has_current_enrollment=has_current_enrollment,
            profile_picture=profile_picture,
            verified=student['verified']
        )

    except Exception as e:
        logging.error(f"[Enrollment Page Error] {str(e)}", exc_info=True)
        flash("An error occurred while loading the enrollment page.", "error")
        return render_template(
            'students/student_enrollment.html',
            classes=[],
            enrolled_classes=[],
            has_current_enrollment=False,
            profile_picture=profile_picture,
            verified=student.get('verified', 'unverified') if 'student' in locals() else 'unverified'
        )
    finally:
        cursor.close()


# -----------------------------
# ENROLLMENT ACTION
# -----------------------------
@student_enrollment_bp.route('/enroll', methods=['POST'])
def enroll():
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized action.'}), 401

    user_id = session['user_id']
    class_id = request.form.get('class_id')

    if not class_id:
        return jsonify({'success': False, 'message': 'Please select a class.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Verify status
        cursor.execute("SELECT account_status, verified FROM login WHERE user_id = %s", (user_id,))
        student = cursor.fetchone()
        if not student or student['account_status'] != 'active' or student['verified'] != 'verified':
            return jsonify({
                'success': False,
                'message': 'You must upload the requirements and wait for verification before enrolling.'
            }), 403

        # Check class availability
        cursor.execute("""
            SELECT cl.class_id, cl.max_students, cl.class_title,
                (SELECT COUNT(*) FROM enrollment 
                 WHERE class_id = cl.class_id AND status IN ('enrolled', 'pending')) AS current_enrollments
            FROM classes cl
            WHERE cl.class_id = %s AND cl.status = 'active'
        """, (class_id,))
        class_info = cursor.fetchone()

        if not class_info:
            return jsonify({'success': False, 'message': 'Selected class not found or inactive.'}), 404

        available_slots = class_info['max_students'] - class_info['current_enrollments']
        if available_slots <= 0:
            return jsonify({'success': False, 'message': 'Class is already full.'}), 400

        # Prevent duplicate enrollment
        cursor.execute("""
            SELECT COUNT(*) AS active_enrollments 
            FROM enrollment 
            WHERE user_id = %s AND status IN ('enrolled', 'pending')
        """, (user_id,))
        active = cursor.fetchone()
        if active and active['active_enrollments'] > 0:
            return jsonify({'success': False, 'message': 'You already have an active or pending enrollment.'}), 400

        # Create enrollment
        cursor.execute("""
            INSERT INTO enrollment (user_id, class_id, enrollment_date, status)
            VALUES (%s, %s, %s, %s)
        """, (user_id, class_id, datetime.now(), 'pending'))
        db.commit()

        return jsonify({
            'success': True,
            'message': f"Enrollment request for '{class_info['class_title']}' submitted successfully and is pending approval."
        })

    except Exception as e:
        db.rollback()
        logging.error(f"[Enroll Error] {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': 'An error occurred. Please try again.'}), 500
    finally:
        cursor.close()


# -----------------------------
# CLASS DETAILS (AJAX FETCH)
# -----------------------------
@student_enrollment_bp.route('/class/<int:class_id>/details', methods=['GET'])
def get_class_details(class_id):
    if 'user_id' not in session or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                cl.class_id,
                cl.class_title,
                cl.schedule,
                cl.venue,
                cl.max_students,
                cl.start_date,
                cl.end_date,
                cl.instructor_name,
                cl.days_of_week,
                co.course_title,
                co.course_description,
                co.course_category,
                co.learning_outcomes,
                co.course_fee,
                co.prerequisites AS course_prerequisites,
                co.duration_hours,
                (cl.max_students - COALESCE((
                    SELECT COUNT(*) 
                    FROM enrollment 
                    WHERE class_id = cl.class_id 
                    AND status IN ('enrolled', 'pending')
                ), 0)) AS available_slots
            FROM classes cl
            JOIN courses co ON cl.course_id = co.course_id
            WHERE cl.class_id = %s AND cl.status = 'active'
        """, (class_id,))
        class_details = cursor.fetchone()

        if not class_details:
            return jsonify({'error': 'Class not found'}), 404

        # ✅ Fix: convert any bytes (BLOB) data to string
        for key, value in class_details.items():
            if isinstance(value, bytes):
                try:
                    class_details[key] = value.decode('utf-8')
                except Exception:
                    class_details[key] = str(value)

        return jsonify(class_details)

    except Exception as e:
        logging.error(f"Error in get_class_details: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        cursor.close()
