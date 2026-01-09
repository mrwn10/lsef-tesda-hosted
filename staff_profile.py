from flask import Blueprint, request, jsonify, session, current_app, url_for, render_template
from database import get_db
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import traceback

staff_profile_bp = Blueprint('staff_profile', __name__, url_prefix='/staff')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_SIGNATURE_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_signature(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_SIGNATURE_EXTENSIONS

# ===== HTML PAGE ENDPOINT =====
@staff_profile_bp.route('/profile', methods=['GET'])
def staff_profile_page():
    """Render the HTML profile page"""
    if 'user_id' not in session or session.get('role') != 'staff':
        # Redirect to login if not authorized
        return render_template('login.html', error='Unauthorized access')
    
    # Just render the template - JavaScript will load data via AJAX
    return render_template('staffs/staff_profile.html')

# ===== JSON API ENDPOINT =====
@staff_profile_bp.route('/profile/data', methods=['GET'])
def staff_profile_data():
    """Return JSON data for the profile (used by AJAX)"""
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 401

    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        query = """
            SELECT l.user_id, l.username, l.email, l.role, l.account_status,
                   pi.info_id, pi.first_name, pi.middle_name, pi.last_name,
                   pi.province, pi.municipality, pi.baranggay,
                   pi.contact_number, pi.date_of_birth, pi.gender,
                   pi.profile_picture, pi.signature, pi.date_registered
            FROM login l
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id = %s
        """
        cursor.execute(query, (user_id,))
        staff = cursor.fetchone()

        if not staff:
            return jsonify({'error': 'Staff profile not found'}), 404

        staff['date_of_birth'] = staff['date_of_birth'].strftime('%Y-%m-%d') if staff['date_of_birth'] else None
        staff['date_registered'] = staff['date_registered'].strftime('%Y-%m-%d %H:%M:%S') if staff['date_registered'] else None

        staff['profile_picture_url'] = url_for(
            'static',
            filename=f"uploads/profile_pictures/{staff['profile_picture']}",
            _external=True
        ) if staff['profile_picture'] else None

        staff['signature_url'] = url_for(
            'static',
            filename=f"uploads/signatures/{staff['signature']}",
            _external=True
        ) if staff['signature'] else None

        return jsonify({'success': True, 'staff': staff})

    except Exception as e:
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to fetch profile'}), 500
    finally:
        cursor.close()


@staff_profile_bp.route('/profile/update', methods=['POST'])
def update_staff_profile():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 401

    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        data = request.form.to_dict()
        files = request.files

        cursor.execute("SELECT password, username, email FROM login WHERE user_id=%s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # ---------------- PROFILE PICTURE ----------------
        profile_picture = None
        if 'profile_picture' in files:
            file = files['profile_picture']
            if file and file.filename and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
                upload_dir = os.path.join(current_app.static_folder, 'uploads', 'profile_pictures')
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, secure_filename(filename)))
                profile_picture = filename

                cursor.execute("SELECT profile_picture FROM personal_information WHERE user_id=%s", (user_id,))
                old = cursor.fetchone()
                if old and old['profile_picture']:
                    old_path = os.path.join(upload_dir, old['profile_picture'])
                    if os.path.exists(old_path):
                        os.remove(old_path)

        # ---------------- SIGNATURE ----------------
        signature_file = None
        if 'signature' in files:
            file = files['signature']
            if file and file.filename and allowed_signature(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
                upload_dir = os.path.join(current_app.static_folder, 'uploads', 'signatures')
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, secure_filename(filename)))
                signature_file = filename

                cursor.execute("SELECT signature FROM personal_information WHERE user_id=%s", (user_id,))
                old = cursor.fetchone()
                if old and old['signature']:
                    old_path = os.path.join(upload_dir, old['signature'])
                    if os.path.exists(old_path):
                        os.remove(old_path)

        # ---------------- PASSWORD ----------------
        password_update = ""
        password_params = ()
        if data.get('current_password') and data.get('new_password'):
            if data['current_password'] != user['password']:
                return jsonify({'error': 'Incorrect current password'}), 400
            password_update = ", password=%s"
            password_params = (data['new_password'],)

        cursor.execute(
            f"UPDATE login SET username=%s, email=%s {password_update} WHERE user_id=%s",
            (data.get('username', user['username']),
             data.get('email', user['email'])) + password_params + (user_id,)
        )

        fields = {
            'first_name': data.get('first_name', ''),
            'middle_name': data.get('middle_name', ''),
            'last_name': data.get('last_name', ''),
            'contact_number': data.get('contact_number', ''),
            'province': data.get('province', ''),
            'municipality': data.get('municipality', ''),
            'baranggay': data.get('baranggay', ''),
            'gender': data.get('gender', ''),
            'date_of_birth': datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
            'user_id': user_id
        }

        if profile_picture:
            fields['profile_picture'] = profile_picture
        if signature_file:
            fields['signature'] = signature_file

        cursor.execute(f"""
            UPDATE personal_information SET
                first_name=%(first_name)s,
                middle_name=%(middle_name)s,
                last_name=%(last_name)s,
                contact_number=%(contact_number)s,
                province=%(province)s,
                municipality=%(municipality)s,
                baranggay=%(baranggay)s,
                date_of_birth=%(date_of_birth)s,
                gender=%(gender)s
                {', profile_picture=%(profile_picture)s' if profile_picture else ''}
                {', signature=%(signature)s' if signature_file else ''}
            WHERE user_id=%(user_id)s
        """, fields)

        db.commit()
        
        # Fetch updated profile to return
        query = """
            SELECT l.username, l.email, l.role, l.account_status,
                   pi.first_name, pi.middle_name, pi.last_name,
                   pi.province, pi.municipality, pi.baranggay,
                   pi.contact_number, pi.date_of_birth, pi.gender,
                   pi.profile_picture, pi.signature
            FROM login l
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.user_id = %s
        """
        cursor.execute(query, (user_id,))
        updated_profile = cursor.fetchone()
        
        if updated_profile and updated_profile['date_of_birth']:
            updated_profile['date_of_birth'] = updated_profile['date_of_birth'].strftime('%Y-%m-%d')
        
        updated_profile['profile_picture_url'] = url_for(
            'static',
            filename=f"uploads/profile_pictures/{updated_profile['profile_picture']}",
            _external=True
        ) if updated_profile['profile_picture'] else None
        
        updated_profile['signature_url'] = url_for(
            'static',
            filename=f"uploads/signatures/{updated_profile['signature']}",
            _external=True
        ) if updated_profile['signature'] else None

        return jsonify({
            'success': True, 
            'message': 'Profile updated successfully',
            'updated_profile': updated_profile
        })

    except Exception as e:
        db.rollback()
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Update failed'}), 500
    finally:
        cursor.close()