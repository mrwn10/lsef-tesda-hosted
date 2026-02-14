from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from database import get_db

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['GET', 'POST'])
def login(): 
    if request.method == 'GET':
        return render_template("all/login.html")
     
    identifier = request.form.get('identifier') if request.form else None
    password = request.form.get('password') if request.form else None
     
    if request.is_json:
        data = request.get_json()
        identifier = data.get('identifier')
        password = data.get('password')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM login 
            WHERE (username = %s OR email = %s) 
            AND password = %s
        """, (identifier, identifier, password))
        
        user = cursor.fetchone()
        
        if user: 
            if user['account_status'] == 'pending':
                return jsonify({
                    'success': False,
                    'message': 'Your account is still pending approval. Please wait for administrator approval.',
                    'type': 'pending'
                })
            
            if user['account_status'] == 'inactive':
                return jsonify({
                    'success': False,
                    'message': 'Your account is inactive. Please contact support.',
                    'type': 'inactive'
                })
             
            session['user_id'] = user['user_id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['logged_in'] = True
             
            cursor.execute("""
                SELECT first_name, last_name FROM personal_information 
                WHERE user_id = %s
            """, (user['user_id'],))
            personal_info = cursor.fetchone()
            
            if personal_info:
                session['full_name'] = f"{personal_info['first_name']} {personal_info['last_name']}"
             
            if user['role'] == 'admin':
                redirect_url = url_for('admin_homepage')
            elif user['role'] == 'staff':
                redirect_url = url_for('staff_homepage')
            elif user['role'] == 'student':
                redirect_url = url_for('student_homepage')
            else:
                return jsonify({
                    'success': False,
                    'message': 'Invalid user role.',
                    'type': 'role_error'
                })
            
            return jsonify({
                'success': True,
                'message': 'Login successful!',
                'type': 'success',
                'redirect': redirect_url,
                'role': user['role']
            })
        
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username/email or password',
                'type': 'credentials_error'
            })
        
    except Exception as e:
        db.rollback()
        print(f"Login error: {str(e)}")  
        return jsonify({
            'success': False,
            'message': 'An error occurred during login. Please try again.',
            'type': 'system_error'
        })
    
    finally:
        cursor.close()

@login_bp.route('/logout')
def logout(): 
    session.clear()
     
    if request.is_json:
        return jsonify({
            'success': True,
            'message': 'You have been logged out.',
            'redirect': url_for('login.login')
        })
     
    flash('You have been logged out.', 'logout_message')
    return redirect(url_for('login.login'))