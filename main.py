from flask import Flask, render_template, request, redirect, flash, session, jsonify, url_for
import os
#import hashlib  
#from datetime import datetime, timedelta

from flask import Flask, render_template
#from flask_cors import CORS
from flask_mail import Mail
from database import close_db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-this-in-production'

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'marwindalin01@gmail.com'
app.config['MAIL_PASSWORD'] = 'xctm qtyg trwc cjxq'

mail = Mail(app)

#Blockchain BP
from database import get_db

#General BP
from register import register
from login import login_bp
from forgot_password import forgot_password_bp
from verify_cert import verify_cert_bp

#General BP
app.register_blueprint(register)
app.register_blueprint(login_bp)
app.register_blueprint(forgot_password_bp)
app.register_blueprint(verify_cert_bp)

#Admin BP
from admin_homepage import admin_homepage_bp
from admin_user_management import admin_user_management_bp
from admin_user_update import admin_user_update_bp
from admin_user_deletion import admin_user_deletion_bp
from admin_user_archive import admin_user_archive_bp
from admin_profile import admin_profile_bp
from admin_courses_approval import admin_courses_approval_bp
from admin_courses_avail import admin_courses_avail_bp
from admin_courses_edit_req import admin_courses_edit_req_bp
from admin_class_management import admin_class_management_bp
from admin_class_approval import admin_class_approval_bp
from admin_class_edit_req import admin_class_edit_req_bp
from admin_create_course import admin_create_course_bp
from admin_edit_course import admin_edit_course_bp
from admin_class_creation import admin_class_creation_bp
from admin_edit_class import admin_edit_class_bp
from admin_enrollment import admin_enrollment_bp
from admin_verified_req import admin_verified_req_bp
from admin_create_staff import admin_create_staff_bp
from admin_materials import admin_materials_bp
from admin_student_grade import admin_student_grades_bp

#Admin BP
app.register_blueprint(admin_homepage_bp)
app.register_blueprint(admin_user_management_bp, url_prefix='/admin/user-management')
app.register_blueprint(admin_user_update_bp)
app.register_blueprint(admin_user_deletion_bp)
app.register_blueprint(admin_user_archive_bp)
app.register_blueprint(admin_profile_bp, url_prefix='/admin')
app.register_blueprint(admin_courses_approval_bp)
app.register_blueprint(admin_courses_avail_bp)
app.register_blueprint(admin_courses_edit_req_bp)
app.register_blueprint(admin_class_management_bp)
app.register_blueprint(admin_class_approval_bp)
app.register_blueprint(admin_class_edit_req_bp)
app.register_blueprint(admin_create_course_bp)
app.register_blueprint(admin_edit_course_bp)
app.register_blueprint(admin_class_creation_bp)
app.register_blueprint(admin_edit_class_bp)
app.register_blueprint(admin_enrollment_bp)
app.register_blueprint(admin_verified_req_bp)
app.register_blueprint(admin_create_staff_bp)
app.register_blueprint(admin_materials_bp)
app.register_blueprint(admin_student_grades_bp, url_prefix='/admin/student_grades')

#Staff BP
from staff_profile import staff_profile_bp
from staff_courses_creation import staff_courses_creation_bp
from staff_courses_edit_req import staff_courses_edit_req_bp
from staff_courses_view import staff_courses_view_bp
from staff_class_management import staff_class_management_bp
from staff_class_creation import staff_class_creation_bp
from staff_class_edit_req import staff_class_edit_req_bp
from staff_class_student_management import staff_class_student_management_bp
from staff_enrollment_acceptance import staff_enrollment_acceptance_bp
from staff_class_certificates import staff_class_certificates_bp
from staff_homepage import staff_homepage_bp
from staff_materials import staff_materials_bp

#Staff BP
app.register_blueprint(staff_profile_bp, url_prefix='/staff')
app.register_blueprint(staff_courses_creation_bp)
app.register_blueprint(staff_courses_edit_req_bp)
app.register_blueprint(staff_courses_view_bp)
app.register_blueprint(staff_class_management_bp)
app.register_blueprint(staff_class_creation_bp)
app.register_blueprint(staff_class_edit_req_bp)
app.register_blueprint(staff_class_student_management_bp)
app.register_blueprint(staff_enrollment_acceptance_bp)
app.register_blueprint(staff_class_certificates_bp)
app.register_blueprint(staff_homepage_bp)
app.register_blueprint(staff_materials_bp)

#Student BP
from student_profile import student_profile_bp
from student_enrollment import student_enrollment_bp
from student_view_class import student_view_class_bp
from student_view_certificates import student_view_certificates_bp
from student_view_grades import student_view_grades_bp
from student_homepage import student_homepage_bp
from student_resources import student_resources_bp
from student_requirements import student_requirements_bp

#Student BP
app.register_blueprint(student_profile_bp, url_prefix='/student')
app.register_blueprint(student_enrollment_bp)
app.register_blueprint(student_view_class_bp)
app.register_blueprint(student_view_certificates_bp)
app.register_blueprint(student_view_grades_bp)
app.register_blueprint(student_homepage_bp)
app.register_blueprint(student_resources_bp)
app.register_blueprint(student_requirements_bp)

# General Routes
@app.route("/")
def landing():
    return render_template("all/landing_page.html")

@app.route("/register")
def register():
    return render_template("all/register.html")

@app.route("/login")
def login():
    return render_template("all/login.html")

@app.route("/forgot_password")
def forgot_password():
    return render_template("all/forgot_password.html")

@app.route("/program")
def program():
    return render_template("all/program.html")

@app.route("/verify_cert")
def verify_cert():
    return render_template("all/verify_cert.html")

#Admin
@app.route("/admin_homepage")
def admin_homepage():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback default

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
    return render_template("admin/admin_homepage.html", profile_picture=profile_picture)

@app.route("/admin_user_management")
def admin_user_management():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback if user has no profile picture

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
    return render_template("admin/admin_user_management.html", profile_picture=profile_picture)

@app.route("/admin_user_update")
def admin_user_update():
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
    return render_template("admin/admin_user_update.html", profile_picture=profile_picture)

@app.route("/admin_user_deletion")
def admin_user_deletion():
    return render_template("admin/admin_user_deletion.html")

@app.route("/admin_user_archive")
def admin_user_archive():
    return render_template("admin/admin_user_archive.html")

@app.route("/admin_courses_approval")
def admin_courses_approval():
    return render_template("admin/admin_courses_approval.html")

@app.route("/admin_courses_avail")
def admin_courses_avail():
    return render_template("admin/admin_courses_avail.html")

@app.route("/admin_courses_edit_req")
def admin_courses_edit_req():
    return render_template("admin/admin_courses_edit_req.html")

@app.route("/admin_profile")
def admin_profile():
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
    return render_template("admin/admin_profile.html", profile_picture=profile_picture)

@app.route("/admin_class_management")
def admin_class_management():
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
    except Exception as e:
        profile_picture = 'default.png'
    finally:
        cursor.close()

    return render_template("admin/admin_class_management.html", profile_picture=profile_picture)

@app.route("/admin_class_approval")
def admin_class_approval():
    return render_template("admin/admin_class_approval.html")

@app.route("/admin_class_edit_req")
def admin_class_edit_req():
    return render_template("admin/admin_class_edit_req.html")



#Students
@app.route("/student_homepage")
def student_homepage():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback

    if user_id:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT profile_picture
                FROM personal_information
                WHERE user_id = %s
            """, (user_id,))
            user = cursor.fetchone()
            if user and user.get('profile_picture'):
                profile_picture = user['profile_picture']
        finally:
            cursor.close()

    return render_template("students/student_homepage.html", profile_picture=profile_picture)

@app.route("/student_profile")
def student_profile():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback

    if user_id:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT profile_picture
                FROM personal_information
                WHERE user_id = %s
            """, (user_id,))
            user = cursor.fetchone()
            if user and user.get('profile_picture'):
                profile_picture = user['profile_picture']
        finally:
            cursor.close()

    return render_template("students/student_profile.html", profile_picture=profile_picture)

@app.route("/student_enrollment")
def student_enrollment():
    
    return render_template("students/student_enrollment.html")

@app.route("/student_view_class")
def student_view_class():
    
    return render_template("students/student_view_class.html")

@app.route("/student_view_certificates")
def student_view_certificates():
    return render_template("students/student_view_certificates.html")

@app.route("/student_view_grades")
def student_view_grades():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback

    if user_id:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT profile_picture
                FROM personal_information
                WHERE user_id = %s
            """, (user_id,))
            user = cursor.fetchone()
            if user and user.get('profile_picture'):
                profile_picture = user['profile_picture']
        finally:
            cursor.close()
    return render_template("students/student_view_grades.html", profile_picture=profile_picture)

@app.route("/student_resources")
def student_resources():
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
    return render_template("students/student_resources.html", profile_picture=profile_picture)

    # Staffs
@app.route("/staff_homepage")
def staff_homepage():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback if user has no profile picture

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

    return render_template("staffs/staff_homepage.html", profile_picture=profile_picture)

@app.route("/staff_profile")
def staff_profile():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback if user has no profile picture

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

    return render_template("staffs/staff_profile.html", profile_picture=profile_picture)


@app.route("/staff_courses_creation")
def staff_courses_creation():
    user_id = session.get('user_id')
    profile_picture = 'default.png'  # fallback if user has no profile picture

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
    return render_template("staffs/staff_courses_creation.html", profile_picture=profile_picture)

@app.route("/staff_courses_edit_req")
def staff_courses_edit_req():
    return render_template("staffs/staff_courses_edit_req.html")

@app.route("/staff_courses_view")
def staff_courses_view():
    return render_template("staffs/staff_courses_view.html")

@app.route("/staff_class_management")
def staff_class_management():
    return render_template("staffs/staff_class_management.html")

@app.route("/staff_class_creation")
def staff_class_creation():
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
    return render_template("staffs/staff_class_creation.html", profile_picture=profile_picture)

@app.route("/staff_class_edit_req")
def staff_class_edit_req():
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
    return render_template("staffs/staff_class_edit_req.html", profile_picture=profile_picture)

@app.route("/staff_class_student_management")
def staff_class_student_management():
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
    return render_template("staffs/staff_class_student_management.html", profile_picture=profile_picture)

@app.route("/staff_enrollment_acceptance")
def staff_enrollment_acceptance():
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
    return render_template("staffs/staff_enrollment_acceptance.html", profile_picture=profile_picture)

@app.route("/staff_materials")
def staff_materials():
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
    return render_template("staffs/staff_materials.html", profile_picture=profile_picture)

if __name__ == "__main__":
    app.run(debug=True)