from flask import Blueprint, render_template, request, jsonify, session, url_for, json, send_file, redirect, flash
from datetime import datetime
from database import get_db
import io
import pandas as pd
import numpy as np
import os
import hashlib
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from PIL import Image
import math
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
import qrcode
from io import BytesIO
import traceback

staff_class_student_management_bp = Blueprint('staff_class_student_management', __name__)

# Register fonts
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
 
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
OFL_FONT_PATH = os.path.join("static", "fonts", "UnifrakturCook-Bold.ttf")
if os.path.exists(OFL_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("UnifrakturCook", OFL_FONT_PATH))
    except Exception as e:
        print("Failed to register UnifrakturCook:", e)
else:
    print("Font file not found:", OFL_FONT_PATH)

# Helper function to check staff authorization
def check_staff_authorization():
    """Check if user is logged in and has staff role"""
    if 'user_id' not in session:
        return False, {'error': 'No active session', 'redirect': url_for('login.login')}, 401
    if session.get('role') != 'staff':
        return False, {'error': 'Unauthorized access - Staff only'}, 403
    return True, None, None

# ===================== GRADE CALCULATION FUNCTIONS =====================

def calculate_average(prelim, midterm, final):
    """Calculate average of three grades, return None if any is missing"""
    if prelim is None or midterm is None or final is None:
        return None
    try:
        prelim = float(prelim)
        midterm = float(midterm)
        final = float(final)
        return (prelim + midterm + final) / 3
    except (ValueError, TypeError) as e:
        print(f"Error calculating average: {e}")
        return None

def calculate_status_and_remarks(prelim, midterm, final):
    """
    Calculate status and remarks based on AVERAGE of all grades
    Rules based on average grade:
    - (96-100) - Excellent (Competent)
    - (91-95) - Very Satisfactory (Competent)
    - (86-90) - Satisfactory (Competent)
    - (81-85) - Fairly Satisfactory (Competent)
    - (75-80) - Passed (Competent)
    - (74-Below) - Failed (Not Yet Competent)
    - Any missing grade: Incomplete
    """
    print(f"Calculating status for grades - Prelim: {prelim}, Midterm: {midterm}, Final: {final}")
    
    # Check for missing grades
    if prelim is None or midterm is None or final is None:
        print("Missing grades, returning Incomplete")
        return "Incomplete", "Incomplete"
    
    try:
        prelim = float(prelim)
        midterm = float(midterm)
        final = float(final)
        
        # Calculate average
        average = (prelim + midterm + final) / 3
        print(f"Average calculated: {average}")
        
        # Determine status based on average
        if average >= 96:
            status = "Excellent (Competent)"
            remarks = "Competent"
        elif average >= 91:
            status = "Very Satisfactory (Competent)"
            remarks = "Competent"
        elif average >= 86:
            status = "Satisfactory (Competent)"
            remarks = "Competent"
        elif average >= 81:
            status = "Fairly Satisfactory (Competent)"
            remarks = "Competent"
        elif average >= 75:
            status = "Passed (Competent)"
            remarks = "Competent"
        else:
            status = "Failed (Not Yet Competent)"
            remarks = "Not Yet Competent"
            
        print(f"Determined status: {status}, remarks: {remarks}")
        return status, remarks
        
    except (ValueError, TypeError) as e:
        print(f"Error calculating status: {e}")
        return "Incomplete", "Incomplete"

# ===================== ROUTE: VIEW CLASS STUDENTS =====================

@staff_class_student_management_bp.route('/staff_class/<int:class_id>/students', methods=['GET'])
def view_class_students(class_id):
    """View all students enrolled in a specific class"""
    print(f"view_class_students called for class_id: {class_id}")
    
    # Check authorization
    auth_result = check_staff_authorization()
    if not auth_result[0]:
        return jsonify(auth_result[1]), auth_result[2]

    db = get_db()
    cursor = db.cursor(dictionary=True)
    staff_user_id = session.get('user_id')
 
    try:
        # Get profile picture
        profile_picture = 'default.png'
        if staff_user_id:
            cursor.execute("""
                SELECT profile_picture FROM personal_information WHERE user_id = %s
            """, (staff_user_id,))
            user = cursor.fetchone()
            if user and user.get('profile_picture'):
                profile_picture = user['profile_picture']
 
        # Get class info including status
        cursor.execute("""
            SELECT class_title, instructor_id, status as class_status FROM classes 
            WHERE class_id = %s
        """, (class_id,))
        class_info = cursor.fetchone()
        
        if not class_info:
            flash('Class not found.', 'error')
            return redirect(url_for('staff_class_management'))
         
        if class_info['instructor_id'] != staff_user_id:
            flash('You are not authorized to manage this class.', 'error')
            return redirect(url_for('staff_class_management'))
 
        # Get enrolled students
        cursor.execute("""
            SELECT 
                pi.first_name, 
                pi.last_name, 
                l.email, 
                l.user_id AS user_id, 
                sg.prelim_grade, 
                sg.midterm_grade, 
                sg.final_grade,
                sg.status,
                sg.remarks,
                e.enrollment_id,
                e.status AS enrollment_status
            FROM enrollment e
            JOIN login l ON e.user_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.class_id = %s 
            AND e.status NOT IN ('pending')
            ORDER BY pi.last_name, pi.first_name
        """, (class_id,))
        students = cursor.fetchall()
         
        for student in students:
            # Calculate average
            avg = calculate_average(
                student.get('prelim_grade'),
                student.get('midterm_grade'),
                student.get('final_grade')
            )
            student['average'] = round(avg, 2) if avg is not None else None
            
            # Calculate status and remarks based on average
            status, remarks = calculate_status_and_remarks(
                student.get('prelim_grade'),
                student.get('midterm_grade'),
                student.get('final_grade')
            )
            student['calculated_status'] = status
            student['calculated_remarks'] = remarks
             
            # Override with enrollment status if completed
            if student['enrollment_status'] == 'completed':
                student['remarks'] = 'Competent'
                student['calculated_remarks'] = 'Competent'

        return render_template(
            'staffs/staff_class_student_management.html',
            students=students,
            class_id=class_id,
            class_title=class_info['class_title'],
            class_status=class_info['class_status'],
            profile_picture=profile_picture
        )
        
    except Exception as e:
        print(f"Error in view_class_students: {str(e)}")
        traceback.print_exc()
        flash(f'Error loading students: {str(e)}', 'error')
        return redirect(url_for('staff_class_management'))
    finally:
        cursor.close()

# ===================== ROUTE: EDIT STUDENT GRADE =====================

@staff_class_student_management_bp.route('/staff_student/edit_grade', methods=['POST'])
def edit_student_grade():
    """
    Edit student grades with comprehensive error handling
    """
    print("=" * 50)
    print("edit_student_grade called at:", datetime.now())
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            return jsonify(auth_result[1]), auth_result[2]

        # Validate JSON
        if not request.is_json:
            print("ERROR: Request is not JSON")
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400

        data = request.get_json()
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({
                'success': False,
                'error': 'No data received'
            }), 400

        print("Received edit data:", data)

        # Extract and validate enrollment_id
        enrollment_id = data.get('enrollment_id')
        if not enrollment_id:
            print("ERROR: Missing enrollment_id")
            return jsonify({
                'success': False,
                'error': 'Missing enrollment_id'
            }), 400

        # Extract grades with proper null handling
        prelim = data.get('prelim_grade')
        midterm = data.get('midterm_grade')
        final = data.get('final_grade')
        use_auto_remarks = data.get('use_auto_remarks', False)
        manual_remarks = data.get('remarks')

        print(f"Raw grades - Prelim: {prelim}, Midterm: {midterm}, Final: {final}")
        print(f"use_auto_remarks: {use_auto_remarks}, manual_remarks: {manual_remarks}")

        # Convert to float or None (handle empty strings, null, undefined)
        def safe_float_conversion(value):
            if value is None:
                return None
            if isinstance(value, str):
                value = value.strip()
                if value == '' or value.lower() in ['null', 'undefined', 'none']:
                    return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None

        prelim = safe_float_conversion(prelim)
        midterm = safe_float_conversion(midterm)
        final = safe_float_conversion(final)

        print(f"Converted grades - Prelim: {prelim}, Midterm: {midterm}, Final: {final}")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Verify instructor authorization
        cursor.execute("""
            SELECT c.instructor_id, c.class_id, c.class_title, c.status as class_status
            FROM enrollment e
            JOIN classes c ON e.class_id = c.class_id
            WHERE e.enrollment_id = %s
        """, (enrollment_id,))
        
        result = cursor.fetchone()
        
        if not result:
            cursor.close()
            print(f"ERROR: Enrollment {enrollment_id} not found")
            return jsonify({
                'success': False,
                'error': 'Enrollment not found'
            }), 404
            
        if result['instructor_id'] != session.get('user_id'):
            cursor.close()
            print(f"ERROR: User {session.get('user_id')} not authorized for enrollment {enrollment_id}")
            return jsonify({
                'success': False,
                'error': 'Unauthorized to edit this grade'
            }), 403

        # Check if class is in a state that allows grade editing
        if result['class_status'] not in ['ongoing', 'completed']:
            cursor.close()
            return jsonify({
                'success': False,
                'error': f'Grades can only be edited for ongoing or completed classes. Current status: {result["class_status"]}'
            }), 400

        # Calculate status and remarks
        if use_auto_remarks:
            status, remarks = calculate_status_and_remarks(prelim, midterm, final)
        else:
            status, _ = calculate_status_and_remarks(prelim, midterm, final)
            remarks = manual_remarks

        print(f"Final - Status: {status}, Remarks: {remarks}")

        # Check if grade record exists
        cursor.execute("SELECT grade_id FROM student_grades WHERE enrollment_id = %s", (enrollment_id,))
        grade = cursor.fetchone()

        if grade:
            cursor.execute("""
                UPDATE student_grades
                SET prelim_grade=%s, midterm_grade=%s, final_grade=%s, remarks=%s, date_recorded=NOW()
                WHERE enrollment_id=%s
            """, (prelim, midterm, final, remarks, enrollment_id))
            print(f"Updated existing grade record for enrollment {enrollment_id}")
        else:
            cursor.execute("""
                INSERT INTO student_grades (enrollment_id, prelim_grade, midterm_grade, final_grade, remarks)
                VALUES (%s, %s, %s, %s, %s)
            """, (enrollment_id, prelim, midterm, final, remarks))
            print(f"Inserted new grade record for enrollment {enrollment_id}")
 
        # Update enrollment status based on remarks
        if remarks == 'Competent':
            cursor.execute("""
                UPDATE enrollment 
                SET status = 'completed' 
                WHERE enrollment_id = %s
            """, (enrollment_id,))
            print(f"Updated enrollment {enrollment_id} status to completed")
        elif remarks == 'Dropped':
            cursor.execute("""
                UPDATE enrollment 
                SET status = 'dropped' 
                WHERE enrollment_id = %s
            """, (enrollment_id,))
            print(f"Updated enrollment {enrollment_id} status to dropped")

        db.commit()
        
        # Calculate average for response
        avg = None
        if prelim is not None and midterm is not None and final is not None:
            avg = (prelim + midterm + final) / 3

        cursor.close()

        response_data = {
            'success': True,
            'message': 'Grade updated successfully',
            'auto_status': status,
            'remarks': remarks,
            'average': round(avg, 2) if avg is not None else None,
            'debug': {
                'prelim': prelim,
                'midterm': midterm,
                'final': final,
                'use_auto_remarks': use_auto_remarks
            }
        }
        
        print("Sending response:", response_data)
        return jsonify(response_data)

    except Exception as e:
        print(f"ERROR in edit_student_grade: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e),
            'debug': 'exception_occurred'
        }), 500

# ===================== ROUTE: GET AUTO STATUS REMARKS =====================

@staff_class_student_management_bp.route('/staff_student/get_auto_status_remarks', methods=['POST'])
def get_auto_status_remarks():
    """
    Calculate automatic status and remarks based on grades
    Returns JSON with status and remarks or error details
    """
    print("=" * 50)
    print("get_auto_status_remarks called at:", datetime.now())
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            return jsonify(auth_result[1]), auth_result[2]

        # Validate JSON
        if not request.is_json:
            print("ERROR: Request is not JSON")
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400

        data = request.get_json()
        if data is None:
            print("ERROR: No JSON data received")
            return jsonify({
                'success': False,
                'error': 'No JSON data received'
            }), 400

        print("Received data:", data)

        # Extract grades with proper null handling
        prelim = data.get('prelim_grade')
        midterm = data.get('midterm_grade')
        final = data.get('final_grade')
        
        print(f"Raw grades - Prelim: {prelim}, Midterm: {midterm}, Final: {final}")
        
        # Convert to float or None
        def safe_float_conversion(value):
            if value is None:
                return None
            if isinstance(value, str):
                value = value.strip()
                if value == '' or value.lower() in ['null', 'undefined', 'none']:
                    return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None

        prelim = safe_float_conversion(prelim)
        midterm = safe_float_conversion(midterm)
        final = safe_float_conversion(final)

        print(f"Converted grades - Prelim: {prelim}, Midterm: {midterm}, Final: {final}")

        # Calculate status and remarks
        status, remarks = calculate_status_and_remarks(prelim, midterm, final)
        print(f"Calculated - Status: {status}, Remarks: {remarks}")

        # Return successful response
        response_data = {
            'success': True,
            'status': status,
            'remarks': remarks,
            'debug': {
                'received_grades': {
                    'prelim': data.get('prelim_grade'),
                    'midterm': data.get('midterm_grade'),
                    'final': data.get('final_grade')
                },
                'converted_grades': {
                    'prelim': prelim,
                    'midterm': midterm,
                    'final': final
                }
            }
        }
        
        print("Sending response:", response_data)
        return jsonify(response_data)

    except Exception as e:
        print(f"UNEXPECTED ERROR in get_auto_status_remarks: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e),
            'debug': 'exception_occurred'
        }), 500

# ===================== ROUTE: GET STUDENT PROFILE =====================

@staff_class_student_management_bp.route('/staff_student_profile/<int:user_id>', methods=['GET'])
def get_student_profile(user_id):
    """Get detailed student profile information"""
    print(f"get_student_profile called for user_id: {user_id}")
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            return jsonify(auth_result[1]), auth_result[2]

        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Get personal information
        cursor.execute("""
            SELECT 
                pi.first_name, pi.middle_name, pi.last_name,
                pi.date_of_birth, pi.gender, pi.province, pi.municipality,
                pi.baranggay, pi.contact_number, pi.profile_picture,
                l.email, l.user_id
            FROM personal_information pi
            JOIN login l ON pi.user_id = l.user_id
            WHERE pi.user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()

        if not profile:
            cursor.close()
            return jsonify({
                'success': False,
                'error': 'Student profile not found'
            }), 404
 
        # Get student's classes and grades
        cursor.execute("""
            SELECT 
                c.class_id, c.class_title, c.schedule, c.days_of_week, c.venue,
                c.start_date, c.end_date, c.instructor_name, c.status as class_status,
                e.enrollment_id, e.status AS enrollment_status,
                sg.prelim_grade, sg.midterm_grade, sg.final_grade, 
                sg.status AS grade_status,
                sg.remarks, sg.date_recorded AS grade_date
            FROM enrollment e
            JOIN classes c ON e.class_id = c.class_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.user_id = %s
            ORDER BY c.start_date DESC
        """, (user_id,))
        classes = cursor.fetchall()

        for cls in classes:
            if cls.get('days_of_week'):
                try:
                    cls['days_of_week'] = json.loads(cls['days_of_week'])
                except:
                    cls['days_of_week'] = None
                    
            # Calculate average
            avg = calculate_average(
                cls.get('prelim_grade'),
                cls.get('midterm_grade'),
                cls.get('final_grade')
            )
            cls['average'] = round(avg, 2) if avg is not None else None
 
        # Get certificates
        cursor.execute("""
            SELECT 
                cert.id, cert.name, cert.course, cert.date, cert.cert_hash, cert.file_path,
                cert.created_at, c.class_title, c.schedule
            FROM certificates cert
            JOIN enrollment e ON cert.enrollment_id = e.enrollment_id
            JOIN classes c ON e.class_id = c.class_id
            WHERE e.user_id = %s
            ORDER BY cert.created_at DESC
        """, (user_id,))
        certificates = cursor.fetchall()

        for cert in certificates:
            if cert['file_path']:
                clean_path = cert['file_path'].lstrip('/\\')
                if not clean_path.startswith('certs/'):
                    clean_path = f"certs/{clean_path}"
                cert['file_path'] = url_for('static', filename=clean_path)

        cursor.close()

        return jsonify({
            'success': True,
            'personal_info': profile,
            'classes': classes,
            'certificates': certificates
        })

    except Exception as e:
        print(f"Error in get_student_profile: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Server Error',
            'message': str(e)
        }), 500

# ===================== ROUTE: DOWNLOAD GRADE SHEET =====================

@staff_class_student_management_bp.route('/staff_class/<int:class_id>/download_grades', methods=['GET'])
def download_grade_sheet(class_id):
    """Download grade sheet as Excel file"""
    print(f"download_grade_sheet called for class_id: {class_id}")
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            return jsonify(auth_result[1]), auth_result[2]

        db = get_db()
        cursor = db.cursor(dictionary=True)
 
        # Verify instructor authorization
        cursor.execute("""
            SELECT instructor_id, class_title 
            FROM classes 
            WHERE class_id = %s
        """, (class_id,))
        class_info = cursor.fetchone()
        
        if not class_info:
            cursor.close()
            flash('Class not found.', 'error')
            return redirect(url_for('staff_class_management'))
            
        if class_info['instructor_id'] != session.get('user_id'):
            cursor.close()
            flash('Unauthorized access.', 'error')
            return redirect(url_for('staff_class_management'))

        # Get student grades
        cursor.execute("""
            SELECT 
                pi.first_name AS First_Name,
                pi.last_name AS Last_Name,
                l.email AS Email,
                sg.prelim_grade AS Prelim_Grade,
                sg.midterm_grade AS Midterm_Grade,
                sg.final_grade AS Final_Grade,
                CASE 
                    WHEN sg.prelim_grade IS NOT NULL AND sg.midterm_grade IS NOT NULL AND sg.final_grade IS NOT NULL 
                    THEN ROUND((sg.prelim_grade + sg.midterm_grade + sg.final_grade) / 3, 2)
                    ELSE NULL
                END AS Average_Grade,
                sg.status AS Grade_Status,
                COALESCE(sg.remarks, 'Not Set') AS Remarks,
                e.status AS Enrollment_Status
            FROM enrollment e
            JOIN login l ON e.user_id = l.user_id
            JOIN personal_information pi ON l.user_id = pi.user_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.class_id = %s 
            AND e.status IN ('enrolled', 'completed', 'pending')
        """, (class_id,))
        
        students = cursor.fetchall()
        cursor.close()
        
        df = pd.DataFrame(students)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Grades')
        output.seek(0)

        safe_title = class_info['class_title'].replace(' ', '_').replace('/', '_')
        return send_file(
            output, 
            download_name=f'class_{class_id}_{safe_title}_grades.xlsx', 
            as_attachment=True
        )
        
    except Exception as e:
        print(f"Error in download_grade_sheet: {str(e)}")
        traceback.print_exc()
        flash(f'Error downloading grade sheet: {str(e)}', 'error')
        return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

# ===================== ROUTE: UPLOAD GRADE SHEET =====================

@staff_class_student_management_bp.route('/staff_class/<int:class_id>/upload_grades', methods=['POST'])
def upload_grade_sheet(class_id):
    """Upload and process grade sheet"""
    print(f"upload_grade_sheet called for class_id: {class_id}")
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            flash('Unauthorized access.', 'error')
            return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

        file = request.files.get('file')
        if not file or file.filename == '':
            flash('No file provided.', 'error')
            return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

        # Verify file extension
        if not file.filename.endswith(('.xlsx', '.xls')):
            flash('Invalid file type. Please upload Excel files only.', 'error')
            return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

        # Verify instructor authorization
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT instructor_id 
            FROM classes 
            WHERE class_id = %s
        """, (class_id,))
        class_info = cursor.fetchone()
        
        if not class_info or class_info['instructor_id'] != session.get('user_id'):
            cursor.close()
            flash('Unauthorized access.', 'error')
            return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))
        
        cursor.close()

        # Read Excel file
        df = pd.read_excel(file)
 
        # Replace NaN with None
        df = df.replace({np.nan: None})

        db = get_db()
        cursor = db.cursor()
        
        success_count = 0
        error_count = 0

        for _, row in df.iterrows():
            try:
                email = row.get('Email')
                prelim = row.get('Prelim_Grade')
                midterm = row.get('Midterm_Grade')
                final = row.get('Final_Grade')
                remarks = row.get('Remarks')

                if not email:
                    error_count += 1
                    continue   
 
                # Calculate remarks if not provided
                if not remarks and prelim is not None and midterm is not None and final is not None:
                    _, remarks = calculate_status_and_remarks(prelim, midterm, final)

                # Find enrollment
                cursor.execute("""
                    SELECT e.enrollment_id 
                    FROM enrollment e
                    JOIN login l ON e.user_id = l.user_id
                    WHERE l.email = %s AND e.class_id = %s
                """, (email, class_id))
                result = cursor.fetchone()

                if result:
                    enrollment_id = result[0]

                    # Check if grade exists
                    cursor.execute("SELECT 1 FROM student_grades WHERE enrollment_id = %s", (enrollment_id,))
                    exists = cursor.fetchone()

                    if exists:
                        cursor.execute("""
                            UPDATE student_grades
                            SET prelim_grade=%s, midterm_grade=%s, final_grade=%s, remarks=%s, date_recorded=NOW()
                            WHERE enrollment_id=%s
                        """, (prelim, midterm, final, remarks, enrollment_id))
                    else:
                        cursor.execute("""
                            INSERT INTO student_grades (enrollment_id, prelim_grade, midterm_grade, final_grade, remarks)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (enrollment_id, prelim, midterm, final, remarks))
 
                    # Update enrollment status based on remarks
                    if remarks == 'Competent':
                        cursor.execute("""
                            UPDATE enrollment 
                            SET status = 'completed' 
                            WHERE enrollment_id = %s
                        """, (enrollment_id,))
                    
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                print(f"Error processing row: {e}")
                error_count += 1

        db.commit()
        cursor.close()
        
        flash(f'Grades successfully uploaded. {success_count} records updated, {error_count} errors.', 'success')

    except Exception as e:
        print(f"Error in upload_grade_sheet: {str(e)}")
        traceback.print_exc()
        flash(f'Error processing file: {str(e)}', 'error')

    return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

# ===================== CERTIFICATE FUNCTIONS =====================

def generate_private_certificate_hash(content):
    """Generate SHA256 hash for certificate verification"""
    return hashlib.sha256(content.encode()).hexdigest()
 
def save_private_certificate(enrollment_id, name, course, date, cert_hash, file_path):
    """Save certificate information to database"""
    file_path = file_path.replace("\\", "/").lstrip("/") 

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT id FROM certificates
            WHERE enrollment_id=%s AND course=%s
        """, (enrollment_id, course))

        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE certificates
                SET name=%s, cert_hash=%s, file_path=%s, date=%s, created_at=NOW()
                WHERE id=%s
            """, (name, cert_hash, file_path, date, existing[0]))
        else:
            cursor.execute("""
                INSERT INTO certificates
                (enrollment_id, name, course, date, cert_hash, file_path, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,NOW())
            """, (enrollment_id, name, course, date, cert_hash, file_path))

        db.commit()
    except Exception as e:
        print(f"Error saving certificate: {e}")
        db.rollback()
        raise
    finally:
        cursor.close()
 
def draw_curved_text(
    c, text, fontname, fontsize,
    center_x, center_y,
    radius_x, radius_y,
    arc_angle=60, upward=True, letter_spacing=1.2
):
    """Draw curved text on PDF"""
    if fontname not in pdfmetrics.getRegisteredFontNames():
        fontname = "Helvetica-Bold"
    if not text:
        return

    c.setFont(fontname, fontsize)
    angle_per_char = (arc_angle / len(text)) * letter_spacing
    start_angle = -((len(text) - 1) * angle_per_char) / 2
    angle = start_angle

    for ch in text:
        rad = math.radians(angle)
        x = center_x + radius_x * math.sin(rad)
        y = center_y + (radius_y * math.cos(rad) if upward else -radius_y * math.cos(rad))
        rotation = -angle if upward else angle

        c.saveState()
        c.translate(x, y)
        c.rotate(rotation)
        c.drawCentredString(0, 0, ch)
        c.restoreState()
        angle += angle_per_char
 
def create_private_completion_certificate(
    recipient_name,
    course_title,
    trainor_user_id,
    output_filename,
    cert_hash=None
):
    """Create PDF completion certificate"""
    page_width, page_height = landscape(letter)
    c = canvas.Canvas(output_filename, pagesize=landscape(letter))
    margin = 0.5 * inch
    center_x = page_width / 2

    def draw_centered_text(text, font, size, x, y, color=colors.black):
        if font not in pdfmetrics.getRegisteredFontNames():
            font = "Helvetica-Bold"
        c.setFont(font, size)
        c.setFillColor(color)
        c.drawCentredString(x, y, text)
        c.setFillColor(colors.black)
 
    # Draw border
    c.setStrokeColor(colors.red)
    c.setLineWidth(25)
    c.rect(margin, margin, page_width - 2*margin, page_height - 2*margin)

    inset = 20
    c.setLineWidth(2)
    c.rect(margin + inset, margin + inset,
           page_width - 2*margin - inset*2,
           page_height - 2*margin - inset*2)

    # Add logo
    logo_path = "static/img/lsef_logo.png"
    if os.path.exists(logo_path):
        logo_width = 120
        logo_height = 100
        bg_width = 100
        bg_height = 90

        logo_x = center_x - (logo_width / 2)
        logo_y = page_height - margin - 67

        bg_x = center_x
        bg_y = logo_y + (logo_height / 2)

        c.setFillColor(colors.white)
        c.setStrokeColor(colors.red)
        c.ellipse(
            bg_x - (bg_width / 2), bg_y - (bg_height / 2),
            bg_x + (bg_width / 2), bg_y + (bg_height / 2),
            fill=1, stroke=0
        )

        logo = ImageReader(logo_path)
        c.drawImage(logo, logo_x, logo_y, width=logo_width, height=logo_height, mask='auto')

    # Add text
    draw_centered_text("菲津富内湖中華學校", "STSong-Light", 30,
                       center_x, page_height - margin - 90, colors.darkred)
    draw_centered_text("Laguna Sino-Filipino Educational Foundation Inc.",
                       "Helvetica-Bold", 25,
                       center_x, page_height - margin - 120)
    draw_centered_text("F. Sario St. Santa Cruz, Laguna",
                       "Helvetica", 18,
                       center_x, page_height - margin - 148)

    draw_curved_text(c, "Certificate of Completion", "UnifrakturCook", 60,
                     center_x, page_height - margin - 420,
                     radius_x=520, radius_y=200)

    draw_centered_text(course_title, "Helvetica-Bold", 24,
                       center_x, page_height - margin - 260)
    draw_centered_text("This certificate is proudly awarded to",
                       "Helvetica", 18,
                       center_x, page_height - margin - 295)
    draw_centered_text(recipient_name, "UnifrakturCook", 50,
                       center_x, page_height - margin - 365)

    c.line(center_x - 220, page_height - margin - 370,
           center_x + 220, page_height - margin - 370)

    draw_centered_text("In recognition of your dedication, passion and hard work",
                       "Helvetica", 18,
                       center_x, page_height - margin - 410)
 
    # Add signatures
    sign_y = page_height - margin - 500
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # Get trainor signature
        cursor.execute("""
            SELECT first_name, last_name, signature
            FROM personal_information WHERE user_id=%s
        """, (trainor_user_id,))
        trainor = cursor.fetchone()

        # Get admin signature
        cursor.execute("""
            SELECT pi.first_name, pi.last_name, pi.signature
            FROM login l
            JOIN personal_information pi ON l.user_id = pi.user_id
            WHERE l.role='admin'
            ORDER BY l.user_id ASC LIMIT 1
        """)
        admin = cursor.fetchone()
    finally:
        cursor.close()

    def draw_signature(x1, x2, name, title, sig):
        c.line(x1, sign_y + 20, x2, sign_y + 20)
        if sig:
            path = os.path.join("static", "uploads", "signatures", sig)
            if os.path.exists(path):
                with Image.open(path) as img:
                    r = min(160/img.width, 50/img.height)
                    c.drawImage(ImageReader(img),
                                x1 + ((x2-x1)-img.width*r)/2,
                                sign_y + 30,
                                img.width*r, img.height*r,
                                mask="auto")
        draw_centered_text(name, "Helvetica-Bold", 18, (x1+x2)/2, sign_y + 25)
        draw_centered_text(title, "Helvetica", 15, (x1+x2)/2, sign_y + 3)

    draw_signature(margin+85, margin+265,
                   f"{trainor['first_name']} {trainor['last_name']}" if trainor else "Instructor",
                   "Instructor",
                   trainor['signature'] if trainor else None)

    draw_signature(page_width-margin-265, page_width-margin-85,
                   f"{admin['first_name']} {admin['last_name']}" if admin else "Chairman",
                   "Chairman, BOT",
                   admin['signature'] if admin else None)
 
    # Add verification page
    c.showPage()

    draw_centered_text("Certificate Verification",
                       "Helvetica-Bold", 28, center_x, page_height - 120)

    VERIFY_BASE_URL = "https://www.lseftesda.online"
    verify_url = f"{VERIFY_BASE_URL}/verify-certificate/{cert_hash}"

    qr = qrcode.make(verify_url)
    buffer = BytesIO()
    qr.save(buffer)
    buffer.seek(0)

    qr_size = 200
    c.drawImage(ImageReader(buffer),
                center_x - qr_size/2,
                page_height/2 - qr_size/2,
                qr_size, qr_size)

    draw_centered_text("Scan the QR code to verify this certificate",
                       "Helvetica", 16, center_x, page_height/2 - 140)

    draw_centered_text("Verification Hash:",
                       "Helvetica-Bold", 14, center_x, page_height/2 - 180)

    draw_centered_text(cert_hash,
                       "Helvetica", 10, center_x, page_height/2 - 200)

    draw_centered_text("If verification fails, contact the issuing institution.",
                       "Helvetica", 12, center_x, 80, colors.gray)

    c.save()

# ===================== ROUTE: GENERATE CERTIFICATE =====================
 
@staff_class_student_management_bp.route('/generate_private_completion', methods=['POST'])
def generate_private_completion():
    """Generate completion certificate for a student"""
    print("generate_private_completion called")
    
    try:
        # Check authorization
        auth_result = check_staff_authorization()
        if not auth_result[0]:
            return jsonify(auth_result[1]), auth_result[2]

        enrollment_id = request.form.get('enrollment_id')
        if not enrollment_id:
            return jsonify({
                'success': False,
                'error': 'Missing enrollment_id'
            }), 400

        print(f"Generating certificate for enrollment_id: {enrollment_id}")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        # Check class status and student remarks
        cursor.execute("""
            SELECT pi.first_name, pi.last_name,
                   c.class_title, c.instructor_id, c.status as class_status,
                   sg.remarks, e.status as enrollment_status
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN classes c ON e.class_id = c.class_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.enrollment_id=%s
        """, (enrollment_id,))
        
        student = cursor.fetchone()
        cursor.close()

        if not student:
            return jsonify({
                'success': False,
                'error': 'Enrollment not found'
            }), 400
            
        print(f"Student data: {student}")
            
        # Certificate can only be generated if:
        # 1. Class status is 'completed'
        # 2. Student remarks is 'Competent' OR enrollment status is 'completed'
        if student['class_status'] != 'completed':
            return jsonify({
                'success': False,
                'error': 'Class must be completed to generate certificates'
            }), 400
            
        if student['remarks'] != 'Competent' and student['enrollment_status'] != 'completed':
            return jsonify({
                'success': False,
                'error': 'Student must be competent/completed to generate certificate'
            }), 400

        recipient_name = f"{student['first_name']} {student['last_name']}"
        course_title = student['class_title']
        trainor_user_id = student['instructor_id']
        date_completed = datetime.now().strftime('%Y-%m-%d')

        # Create certificates directory if it doesn't exist
        CERT_DIR = os.path.join("static", "certs")
        os.makedirs(CERT_DIR, exist_ok=True)

        # Generate safe filename
        safe_name = recipient_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
        safe_course = course_title.replace(" ", "_").replace("/", "_").replace("\\", "_")
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        cert_filename = f"Certificate_{safe_name}_{safe_course}_{timestamp}.pdf"
        cert_path = os.path.join(CERT_DIR, cert_filename)

        # Generate certificate hash
        cert_hash = generate_private_certificate_hash(
            f"{recipient_name}{course_title}{date_completed}{enrollment_id}{timestamp}"
        )

        # Create PDF certificate
        create_private_completion_certificate(
            recipient_name,
            course_title,
            trainor_user_id,
            cert_path,
            cert_hash
        )
 
        relative_path = f"certs/{cert_filename}"

        # Save to database
        save_private_certificate(
            enrollment_id,
            recipient_name,
            course_title,
            date_completed,
            cert_hash,
            relative_path
        )

        return jsonify({
            "success": True,
            "message": "Certificate generated successfully",
            "file_path": url_for('static', filename=relative_path),
            "cert_hash": cert_hash,
            "filename": cert_filename
        })

    except Exception as e:
        print(f"ERROR in generate_private_completion: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ===================== ERROR HANDLERS =====================

@staff_class_student_management_bp.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors for API routes"""
    if request.path.startswith('/staff_student/') and request.method == 'POST':
        return jsonify({
            'success': False,
            'error': 'Endpoint not found',
            'debug': '404_error'
        }), 404
    return error

@staff_class_student_management_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors for API routes"""
    if request.path.startswith('/staff_student/') and request.method == 'POST':
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'debug': '500_error'
        }), 500
    return error