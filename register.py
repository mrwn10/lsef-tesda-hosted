from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime, date
from werkzeug.utils import secure_filename
import re
import os
from database import get_db

register = Blueprint('register', __name__)

UPLOAD_FOLDER = 'static/uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@register.route('/register', methods=['GET', 'POST'])
def register_user():
    if request.method == 'POST':
 
        if 'profile_picture' not in request.files:
            flash("Profile picture is required", 'danger')
            return render_template(
                'all/register.html',
                datetime=datetime,
                date=date,
                form_data={}
            )

        profile_picture = request.files['profile_picture']

        if profile_picture.filename == '':
            flash("Profile picture is required", 'danger')
            return render_template(
                'all/register.html',
                datetime=datetime,
                date=date,
                form_data={}
            )

        if not allowed_file(profile_picture.filename):
            flash("Invalid profile picture format (PNG, JPG, JPEG, GIF only)", 'danger')
            return render_template(
                'all/register.html',
                datetime=datetime,
                date=date,
                form_data={}
            )
 
        filename = secure_filename(profile_picture.filename)
 
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
 
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
 
        form_data = {
            'username': request.form['username'],
            'email': request.form['email'],
            'role': request.form.get('role', 'student'),
            'first_name': request.form['first_name'],
            'middle_name': request.form.get('middle_name', ''),
            'last_name': request.form['last_name'],
            'date_of_birth': request.form['date_of_birth'],
            'gender': request.form['gender'],
            'province': request.form['province'],
            'municipality': request.form['municipal'],
            'baranggay': request.form['barangay'],
            'contact_number': request.form['contact_number'],
            'terms_accepted': 'terms' in request.form
        }

        password = request.form['password']
        confirm_password = request.form['confirm_password']

        errors = []
 
        password_validation = {
            'min_length': len(password) >= 8,
            'has_upper': any(c.isupper() for c in password),
            'has_lower': any(c.islower() for c in password),
            'has_number': any(c.isdigit() for c in password),
            'has_special': any(not c.isalnum() for c in password)
        }

        if not all(password_validation.values()):
            errors.append(
                "Password must contain: 8+ characters, uppercase, lowercase, number, and special character"
            )

        if password != confirm_password:
            errors.append("Passwords do not match")

        if not EMAIL_REGEX.match(form_data['email']):
            errors.append("Invalid email format")

        if not form_data['terms_accepted']:
            errors.append("You must accept the terms and conditions")

        try:
            dob = datetime.strptime(form_data['date_of_birth'], '%Y-%m-%d').date()
            if dob >= date.today():
                errors.append("Date of birth must be in the past")
        except ValueError:
            errors.append("Invalid date format (YYYY-MM-DD)")

        if errors:
            for error in errors:
                flash(error, 'danger')
            return render_template(
                'all/register.html',
                datetime=datetime,
                date=date,
                form_data=form_data,
                password_errors=password_validation
            )

        db = get_db()
        cursor = db.cursor()

        try: 
            cursor.execute(
                "SELECT * FROM login WHERE username = %s OR email = %s",
                (form_data['username'], form_data['email'])
            )
            if cursor.fetchone():
                flash("Username or email already exists", 'danger')
                return render_template(
                    'all/register.html',
                    datetime=datetime,
                    date=date,
                    form_data=form_data
                )
 
            profile_picture.save(file_path)
 
            cursor.execute(
                """
                INSERT INTO login (username, password, email, role, account_status)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    form_data['username'],
                    password,
                    form_data['email'],
                    form_data['role'],
                    'pending'
                )
            )
            user_id = cursor.lastrowid
 
            cursor.execute(
                """
                INSERT INTO personal_information
                (user_id, province, municipality, baranggay, contact_number,
                 first_name, middle_name, last_name, date_of_birth, gender,
                 profile_picture, terms_accepted)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    form_data['province'],
                    form_data['municipality'],
                    form_data['baranggay'],
                    form_data['contact_number'],
                    form_data['first_name'],
                    form_data['middle_name'],
                    form_data['last_name'],
                    form_data['date_of_birth'],
                    form_data['gender'],
                    unique_filename,
                    int(form_data['terms_accepted'])
                )
            )

            db.commit()
 
            return jsonify({
                'success': True,
                'message': 'Registration successful! Your account is pending approval.',
                'modal_title': 'Registration Successful'
            })

        except Exception as e:
            db.rollback()
            return jsonify({
                'success': False,
                'message': f'Registration failed: {str(e)}'
            })

        finally:
            cursor.close()

    return render_template(
        'all/register.html',
        datetime=datetime,
        date=date,
        form_data={}
    )

@register.route('/check_username', methods=['POST'])
def check_username():
    username = request.json.get('username')
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

@register.route('/check_email', methods=['POST'])
def check_email():
    email = request.json.get('email')
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

@register.route('/suggest_username', methods=['POST'])
def suggest_username():
    data = request.json
    first_name = data.get('first_name', '').strip().lower()
    middle_name = data.get('middle_name', '').strip().lower()
    last_name = data.get('last_name', '').strip().lower()
    
    if not first_name or not last_name:
        return jsonify({'suggestions': []})
     
    suggestions = generate_username_variations(first_name, middle_name, last_name)
     
    available_suggestions = check_username_availability(suggestions)
    
    return jsonify({
        'suggestions': available_suggestions[:5]  
    })

def generate_username_variations(first_name, middle_name, last_name):
    """Generate various username combinations based on name parts"""
    variations = []
     
    first_clean = re.sub(r'[^a-z0-9]', '', first_name)
    middle_clean = re.sub(r'[^a-z0-9]', '', middle_name) if middle_name else ''
    last_clean = re.sub(r'[^a-z0-9]', '', last_name)
     
    if first_clean and last_clean:
        variations.extend([
            f"{first_clean}{last_clean}",         
            f"{first_clean}.{last_clean}",        
            f"{first_clean[0]}{last_clean}",     
            f"{first_clean}{last_clean[0]}",      
            f"{first_clean}_{last_clean}",          
        ])
     
    if middle_clean:
        variations.extend([
            f"{first_clean}{middle_clean[0]}{last_clean}",  
            f"{first_clean}.{middle_clean[0]}.{last_clean}", 
            f"{first_clean[0]}{middle_clean[0]}{last_clean}", 
        ])
     
    variations_with_numbers = []
    for variation in variations:
        variations_with_numbers.extend([
            variation,
            f"{variation}123",
            f"{variation}2024",
            f"{variation}1"
        ])
     
    unique_variations = []
    for variation in variations_with_numbers:
        if 3 <= len(variation) <= 20 and variation not in unique_variations:
            unique_variations.append(variation)
    
    return unique_variations

def check_username_availability(usernames):
    """Check which usernames are available in the database"""
    if not usernames:
        return []
    
    db = get_db()
    cursor = db.cursor()
     
    placeholders = ', '.join(['%s'] * len(usernames))
    query = f"SELECT username FROM login WHERE username IN ({placeholders})"
    
    cursor.execute(query, usernames)
    taken_usernames = {row[0] for row in cursor.fetchall()}
    cursor.close()
     
    available = [username for username in usernames if username not in taken_usernames]
    
    return available