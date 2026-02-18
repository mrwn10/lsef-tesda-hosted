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
 
@staff_profile_bp.route('/profile', methods=['GET'])
def staff_profile_page():
    """Render the HTML profile page"""
    if 'user_id' not in session or session.get('role') != 'staff': 
        return render_template('login.html', error='Unauthorized access')
     
    return render_template('staffs/staff_profile.html')
 
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
            SELECT l.user_id, l.username, l.email, l.role, l.account_status, l.verified,
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
        
        # Determine signature status
        if not staff['signature']:
            staff['signature_status'] = 'none'
            staff['signature_status_text'] = 'No signature uploaded'
            staff['signature_status_description'] = 'You haven\'t uploaded a signature yet. Please upload your e-signature for document verification.'
        elif staff['verified'] == 'verified':
            staff['signature_status'] = 'verified'
            staff['signature_status_text'] = 'Verified'
            staff['signature_status_description'] = '✓ Your signature has been verified and approved for official documents.'
        elif staff['verified'] == 'rejected':
            staff['signature_status'] = 'rejected'
            staff['signature_status_text'] = 'Rejected'
            staff['signature_status_description'] = '✗ Your signature was rejected. Please upload a new signature following the guidelines.'
        else:  # pending or null
            staff['signature_status'] = 'pending'
            staff['signature_status_text'] = 'Pending Verification'
            staff['signature_status_description'] = 'Your signature is pending admin verification. You\'ll be notified once approved.'

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
 
        # Handle profile picture upload (overwrite)
        profile_picture = None
        if 'profile_picture' in files:
            file = files['profile_picture']
            if file and file.filename and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
                upload_dir = os.path.join(current_app.static_folder, 'uploads', 'profile_pictures')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Delete old profile picture if exists
                cursor.execute("SELECT profile_picture FROM personal_information WHERE user_id=%s", (user_id,))
                old = cursor.fetchone()
                if old and old['profile_picture']:
                    old_path = os.path.join(upload_dir, old['profile_picture'])
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                file.save(os.path.join(upload_dir, secure_filename(filename)))
                profile_picture = filename
 
        # Handle signature upload (overwrite) - this will reset verification status
        signature_file = None
        signature_updated = False
        if 'signature' in files:
            file = files['signature']
            if file and file.filename and allowed_signature(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
                upload_dir = os.path.join(current_app.static_folder, 'uploads', 'signatures')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Delete old signature if exists
                cursor.execute("SELECT signature FROM personal_information WHERE user_id=%s", (user_id,))
                old = cursor.fetchone()
                if old and old['signature']:
                    old_path = os.path.join(upload_dir, old['signature'])
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                file.save(os.path.join(upload_dir, secure_filename(filename)))
                signature_file = filename
                signature_updated = True
 
        # Handle password update
        password_update = ""
        password_params = ()
        if data.get('current_password') and data.get('new_password'):
            if data['current_password'] != user['password']:
                return jsonify({'error': 'Incorrect current password'}), 400
            password_update = ", password=%s"
            password_params = (data['new_password'],)

        # Update login table
        cursor.execute(
            f"UPDATE login SET username=%s, email=%s {password_update} WHERE user_id=%s",
            (data.get('username', user['username']),
             data.get('email', user['email'])) + password_params + (user_id,)
        )

        # If signature was updated, reset verification status to pending
        if signature_updated:
            cursor.execute("""
                UPDATE login SET verified='pending' 
                WHERE user_id=%s AND role='staff'
            """, (user_id,))

        # Prepare fields for personal_information update
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

        # Build dynamic SQL for personal_information update
        update_fields = []
        update_values = []
        
        for key, value in fields.items():
            if key != 'user_id':
                update_fields.append(f"{key}=%s")
                update_values.append(value)
        
        if profile_picture:
            update_fields.append("profile_picture=%s")
            update_values.append(profile_picture)
            
        if signature_file:
            update_fields.append("signature=%s")
            update_values.append(signature_file)
        
        update_values.append(user_id)
        
        if update_fields:
            cursor.execute(f"""
                UPDATE personal_information SET
                    {', '.join(update_fields)}
                WHERE user_id=%s
            """, update_values)

        db.commit()
         
        # Fetch updated profile
        query = """
            SELECT l.username, l.email, l.role, l.account_status, l.verified,
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
        
        # Determine signature status for updated profile
        if not updated_profile['signature']:
            updated_profile['signature_status'] = 'none'
            updated_profile['signature_status_text'] = 'No signature uploaded'
            updated_profile['signature_status_description'] = 'You haven\'t uploaded a signature yet. Please upload your e-signature for document verification.'
        elif updated_profile['verified'] == 'verified':
            updated_profile['signature_status'] = 'verified'
            updated_profile['signature_status_text'] = 'Verified'
            updated_profile['signature_status_description'] = '✓ Your signature has been verified and approved for official documents.'
        elif updated_profile['verified'] == 'rejected':
            updated_profile['signature_status'] = 'rejected'
            updated_profile['signature_status_text'] = 'Rejected'
            updated_profile['signature_status_description'] = '✗ Your signature was rejected. Please upload a new signature following the guidelines.'
        else:  # pending or null
            updated_profile['signature_status'] = 'pending'
            updated_profile['signature_status_text'] = 'Pending Verification'
            updated_profile['signature_status_description'] = 'Your signature is pending admin verification. You\'ll be notified once approved.'

        return jsonify({
            'success': True, 
            'message': 'Profile updated successfully',
            'updated_profile': updated_profile,
            'signature_updated': signature_updated,
            'new_status': 'pending' if signature_updated else None
        })

    except Exception as e:
        db.rollback()
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Update failed'}), 500
    finally:
        cursor.close()