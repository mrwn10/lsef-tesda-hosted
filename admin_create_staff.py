from flask import Blueprint, request, jsonify, session, flash, render_template, redirect, url_for
from database import get_db
import re

admin_create_staff_bp = Blueprint('admin_create_staff', __name__, url_prefix='/admin')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@admin_create_staff_bp.route('/create-staff', methods=['GET', 'POST'])
def create_staff():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('Unauthorized access', 'danger')
        return redirect(url_for('auth.login'))
 
    db = get_db()
    cursor = db.cursor()
    profile_picture = None
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

    if request.method == 'POST':
        
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        errors = []
 
        if not username:
            errors.append("Username is required")
        elif len(username) < 3:
            errors.append("Username must be at least 3 characters long")

        if not email:
            errors.append("Email is required")
        elif not EMAIL_REGEX.match(email):
            errors.append("Invalid email format")
 
        password_validation = {
            'min_length': len(password) >= 8,
            'has_upper': any(c.isupper() for c in password),
            'has_lower': any(c.islower() for c in password),
            'has_number': any(c.isdigit() for c in password),
            'has_special': any(not c.isalnum() for c in password)
        }

        if not all(password_validation.values()):
            errors.append("Password must contain: 8+ characters, uppercase, lowercase, number, and special character")

        if password != confirm_password:
            errors.append("Passwords do not match")

        if errors:
            for error in errors:
                flash(error, 'danger')
            return render_template(
                'admin/admin_create_staff.html',
                form_data=request.form,
                password_errors=password_validation,
                profile_picture=profile_picture
            )

        cursor = db.cursor()
        try: 
            cursor.execute(
                "SELECT user_id FROM login WHERE username = %s OR email = %s",
                (username, email)
            )
            existing_user = cursor.fetchone()

            if existing_user:
                flash("Username or email already exists", 'danger')
                return render_template(
                    'admin/admin_create_staff.html',
                    form_data=request.form,
                    profile_picture=profile_picture
                )

            cursor.execute(
                "INSERT INTO login (username, password, email, role, account_status, verified) VALUES (%s, %s, %s, %s, %s, %s)",
                (username, password, email, 'staff', 'active', 'pending')
            )
            
            user_id = cursor.lastrowid
            cursor.execute(
                """INSERT INTO personal_information 
                (user_id, province, municipality, baranggay, contact_number, 
                 first_name, middle_name, last_name, date_of_birth, gender, terms_accepted) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (user_id, 'Not set', 'Not set', 'Not set', 'Not set', 
                 'Staff', '', 'Member', '2000-01-01', 'other', 1)
            )

            db.commit()
            flash(f"Staff account created successfully! Username: {username}", 'success')
            return render_template(
                'admin/admin_create_staff.html',
                form_data={},
                creation_success=True,
                profile_picture=profile_picture
            )

        except Exception as e:
            db.rollback()
            flash(f"Failed to create staff account: {str(e)}", 'danger')
            return render_template(
                'admin/admin_create_staff.html',
                form_data=request.form,
                profile_picture=profile_picture
            )
        finally:
            cursor.close()

    return render_template(
        'admin/admin_create_staff.html',
        form_data={},
        profile_picture=profile_picture
    )


@admin_create_staff_bp.route('/check_staff_username', methods=['POST'])
def check_staff_username():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'available': False, 'message': 'Unauthorized'}), 401
    
    username = request.json.get('username', '').strip()
    if not username:
        return jsonify({'available': False, 'message': 'Username is required'})
    
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT user_id FROM login WHERE username = %s", (username,))
    exists = cursor.fetchone() is not None
    cursor.close()
    
    return jsonify({
        'available': not exists, 
        'message': 'Username already taken' if exists else 'Username available'
    })

@admin_create_staff_bp.route('/check_staff_email', methods=['POST'])
def check_staff_email():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'available': False, 'message': 'Unauthorized'}), 401
    
    email = request.json.get('email', '').strip()
    if not email:
        return jsonify({'available': False, 'message': 'Email is required'})
    
    if not EMAIL_REGEX.match(email):
        return jsonify({'available': False, 'message': 'Invalid email format'})
    
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT user_id FROM login WHERE email = %s", (email,))
    exists = cursor.fetchone() is not None
    cursor.close()
    
    return jsonify({
        'available': not exists, 
        'message': 'Email already registered' if exists else 'Email available'
    })