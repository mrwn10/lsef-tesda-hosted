# admin_student_grades.py - FIXED VERSION
from flask import Blueprint, render_template, request, jsonify, session, url_for, send_file, flash, redirect
from datetime import datetime
from database import get_db
import io
import pandas as pd
import numpy as np
import os
import hashlib
import json
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

admin_student_grades_bp = Blueprint('admin_student_grades', __name__)

# Register fonts
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
OFL_FONT_PATH = os.path.join("static", "fonts", "UnifrakturCook-Bold.ttf")
if os.path.exists(OFL_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("UnifrakturCook", OFL_FONT_PATH))
    except Exception as e:
        print("Failed to register UnifrakturCook:", e)

# ===================== HELPER FUNCTIONS =====================
def calculate_remarks(prelim, midterm, final, enrollment_status=None):
    """
    Automatically calculate remarks based on grades
    Rules:
    - If enrollment status is 'dropped', return 'Dropped'
    - All three grades must be provided
    - Average >= 75: Competent
    - Average < 75: Not yet competent
    - Any missing grade: Incomplete
    """
    # Check if student is dropped
    if enrollment_status and enrollment_status.lower() == 'dropped':
        return "Dropped"
    
    if prelim is None or midterm is None or final is None:
        return "Incomplete"
    
    try:
        prelim = float(prelim)
        midterm = float(midterm)
        final = float(final)
        
        average = (prelim + midterm + final) / 3
        
        if average >= 75:
            return "Competent"
        else:
            return "Not yet competent"
    except (ValueError, TypeError):
        return "Incomplete"

def generate_certificate_hash(content):
    return hashlib.sha256(content.encode()).hexdigest()

# ===================== MAIN VIEW - ALL STUDENT GRADES =====================
@admin_student_grades_bp.route('/student_grades', methods=['GET'])
def view_grades():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('Unauthorized access.', 'error')
        return redirect(url_for('login.logout'))
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    admin_user_id = session.get('user_id')
    
    # Fetch admin profile picture
    profile_picture = 'default.png'
    if admin_user_id:
        cursor.execute("""
            SELECT profile_picture FROM personal_information WHERE user_id = %s
        """, (admin_user_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']
    
    # Get filter parameters
    class_id = request.args.get('class_id')
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    # MODIFIED QUERY: Exclude enrollments with status = 'pending'
    query = """
        SELECT 
            e.enrollment_id,
            e.status AS enrollment_status,
            pi.first_name, 
            pi.last_name, 
            l.email,
            l.user_id,
            c.class_id,
            c.class_title,
            c.instructor_name,
            sg.prelim_grade, 
            sg.midterm_grade, 
            sg.final_grade, 
            sg.remarks,
            sg.date_recorded
        FROM enrollment e
        JOIN login l ON e.user_id = l.user_id
        JOIN personal_information pi ON l.user_id = pi.user_id
        JOIN classes c ON e.class_id = c.class_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE e.status != 'pending'  -- EXCLUDE pending enrollments
    """
    
    params = []
    
    # Apply filters
    if class_id:
        query += " AND c.class_id = %s"
        params.append(class_id)
    
    if status:
        if status == 'Competent':
            # FIXED: Check both enrollment status and grade remarks
            query += " AND (e.status = 'completed' OR sg.remarks = 'Competent')"
        elif status == 'Dropped':
            query += " AND (e.status = 'dropped' OR sg.remarks = 'Dropped')"
        elif status == 'enrolled':
            # Show only active enrollments (excluding pending)
            query += " AND e.status = 'enrolled'"
        else:
            query += " AND e.status = %s"
            params.append(status)
    
    if search:
        query += " AND (pi.first_name LIKE %s OR pi.last_name LIKE %s OR l.email LIKE %s)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    
    query += " ORDER BY c.class_title, pi.last_name, pi.first_name"
    
    cursor.execute(query, params)
    students = cursor.fetchall()
    
    # Calculate automatic remarks for display
    for student in students:
        auto_remarks = calculate_remarks(
            student.get('prelim_grade'),
            student.get('midterm_grade'),
            student.get('final_grade'),
            student.get('enrollment_status')
        )
        student['auto_remarks'] = auto_remarks
        
        # Also update enrollment_status for display consistency
        if student.get('remarks') == 'Competent':
            student['enrollment_status'] = 'Competent'
        elif student.get('remarks') == 'Dropped':
            student['enrollment_status'] = 'dropped'
    
    # Get all classes for filter dropdown
    cursor.execute("""
        SELECT class_id, class_title, school_year 
        FROM classes 
        WHERE status = 'active'
        ORDER BY class_title
    """)
    classes = cursor.fetchall()
    
    cursor.close()
    
    return render_template(
        'admin/admin_student_grade.html',
        students=students,
        classes=classes,
        profile_picture=profile_picture
    )

# ===================== EDIT STUDENT GRADE =====================
@admin_student_grades_bp.route('/student_grades/edit', methods=['POST'])
def edit_student_grade():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.json
    enrollment_id = data.get('enrollment_id')
    prelim = data.get('prelim_grade')
    midterm = data.get('midterm_grade')
    final = data.get('final_grade')
    remarks = data.get('remarks')
    use_auto_remarks = data.get('use_auto_remarks', False)
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Get current enrollment status for remarks calculation
        cursor.execute("SELECT status FROM enrollment WHERE enrollment_id = %s", (enrollment_id,))
        enrollment = cursor.fetchone()
        enrollment_status = enrollment['status'] if enrollment else None
        
        # Calculate automatic remarks if requested
        if use_auto_remarks:
            remarks = calculate_remarks(prelim, midterm, final, enrollment_status)
        
        # Check if grade record exists
        cursor.execute("SELECT 1 FROM student_grades WHERE enrollment_id = %s", (enrollment_id,))
        grade_exists = cursor.fetchone()
        
        if grade_exists:
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
        if remarks == 'Dropped':
            cursor.execute("""
                UPDATE enrollment 
                SET status = 'dropped' 
                WHERE enrollment_id = %s
            """, (enrollment_id,))
        elif remarks == 'Competent':
            cursor.execute("""
                UPDATE enrollment 
                SET status = 'completed' 
                WHERE enrollment_id = %s
            """, (enrollment_id,))
        elif remarks in ['Not yet competent', 'Incomplete']:
            # Only update if not already dropped
            if enrollment_status != 'dropped':
                cursor.execute("""
                    UPDATE enrollment 
                    SET status = 'enrolled' 
                    WHERE enrollment_id = %s
                """, (enrollment_id,))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Grade and remarks updated successfully',
            'auto_remarks': calculate_remarks(prelim, midterm, final, enrollment_status) if use_auto_remarks else None
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({
            'error': 'Database error',
            'message': str(e)
        }), 500
        
    finally:
        cursor.close()

# ===================== GET AUTO REMARKS =====================
@admin_student_grades_bp.route('/student_grades/get_auto_remarks', methods=['POST'])
def get_auto_remarks():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.json
    prelim = data.get('prelim_grade')
    midterm = data.get('midterm_grade')
    final = data.get('final_grade')
    enrollment_status = data.get('enrollment_status')
    
    auto_remarks = calculate_remarks(prelim, midterm, final, enrollment_status)
    
    return jsonify({
        'auto_remarks': auto_remarks,
        'success': True
    })

# ===================== STUDENT PROFILE =====================
@admin_student_grades_bp.route('/student_grades/profile/<int:user_id>', methods=['GET'])
def get_student_profile(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Personal Info
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
            return jsonify({'error': 'Student profile not found'}), 404
        
        # Enrolled Classes - Include all statuses
        cursor.execute("""
            SELECT 
                c.class_id, c.class_title, c.schedule, c.days_of_week, c.venue,
                c.start_date, c.end_date, c.instructor_name,
                e.enrollment_id, e.status AS enrollment_status,
                sg.prelim_grade, sg.midterm_grade, sg.final_grade, sg.remarks, sg.date_recorded AS grade_date
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
        
        # Certificates
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
        
        return jsonify({
            'personal_info': profile,
            'classes': classes,
            'certificates': certificates,
            'success': True
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'message': f'Failed to fetch student profile: {str(e)}'
        }), 500
        
    finally:
        cursor.close()

# ===================== DOWNLOAD ALL GRADES =====================
@admin_student_grades_bp.route('/student_grades/download_all', methods=['GET'])
def download_all_grades():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Get filter parameters
    class_id = request.args.get('class_id')
    status = request.args.get('status')
    
    # Base query - Get ALL students
    query = """
        SELECT 
            pi.first_name AS First_Name,
            pi.last_name AS Last_Name,
            l.email AS Email,
            c.class_title AS Class,
            c.instructor_name AS Instructor,
            sg.prelim_grade AS Prelim_Grade,
            sg.midterm_grade AS Midterm_Grade,
            sg.final_grade AS Final_Grade,
            CASE 
                WHEN sg.prelim_grade IS NOT NULL AND sg.midterm_grade IS NOT NULL AND sg.final_grade IS NOT NULL 
                THEN ROUND((sg.prelim_grade + sg.midterm_grade + sg.final_grade) / 3, 2)
                ELSE NULL
            END AS Average_Grade,
            COALESCE(sg.remarks, 'Not Set') AS Remarks,
            e.status AS Enrollment_Status
        FROM enrollment e
        JOIN login l ON e.user_id = l.user_id
        JOIN personal_information pi ON l.user_id = pi.user_id
        JOIN classes c ON e.class_id = c.class_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE 1=1
    """
    
    params = []
    
    # Apply filters
    if class_id:
        query += " AND c.class_id = %s"
        params.append(class_id)
    
    if status:
        if status == 'Competent':
            query += " AND (e.status = 'completed' OR sg.remarks = 'Competent')"
        elif status == 'dropped':
            query += " AND (e.status = 'dropped' OR sg.remarks = 'Dropped')"
        elif status == 'enrolled':
            query += " AND e.status IN ('enrolled', 'pending')"
        else:
            query += " AND e.status = %s"
            params.append(status)
    
    query += " ORDER BY c.class_title, pi.last_name, pi.first_name"
    
    cursor.execute(query, params)
    students = cursor.fetchall()
    
    # Create DataFrame
    df = pd.DataFrame(students)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='All_Grades')
        
        # Get workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['All_Grades']
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4F81BD',
            'font_color': 'white',
            'border': 1
        })
        
        # Format headers
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Auto-adjust column widths
        for i, col in enumerate(df.columns):
            column_len = max(df[col].astype(str).str.len().max(), len(col)) + 2
            worksheet.set_column(i, i, column_len)
    
    output.seek(0)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'all_student_grades_{timestamp}.xlsx'
    
    cursor.close()
    
    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

# ===================== UPLOAD BULK GRADES =====================
@admin_student_grades_bp.route('/student_grades/upload_bulk', methods=['POST'])
def upload_bulk_grades():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    file = request.files.get('file')
    if not file or file.filename == '':
        return jsonify({'error': 'No file provided'}), 400
    
    try:
        # Read Excel file
        df = pd.read_excel(file)
        
        # Validate required columns
        required_columns = ['Email', 'Class', 'Prelim_Grade', 'Midterm_Grade', 'Final_Grade']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                'error': f'Missing required columns: {", ".join(missing_columns)}'
            }), 400
        
        # Replace NaN with None
        df = df.replace({np.nan: None})
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        updated_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                email = row.get('Email')
                class_title = row.get('Class')
                prelim = row.get('Prelim_Grade')
                midterm = row.get('Midterm_Grade')
                final = row.get('Final_Grade')
                remarks = row.get('Remarks')
                
                if not email or not class_title:
                    errors.append(f"Row {index + 2}: Missing email or class")
                    continue
                
                # Get enrollment ID and status
                cursor.execute("""
                    SELECT e.enrollment_id, e.status
                    FROM enrollment e
                    JOIN login l ON e.user_id = l.user_id
                    JOIN classes c ON e.class_id = c.class_id
                    WHERE l.email = %s AND c.class_title = %s
                """, (email, class_title))
                result = cursor.fetchone()
                
                if not result:
                    errors.append(f"Row {index + 2}: Student {email} not found in class {class_title}")
                    continue
                
                enrollment_id = result['enrollment_id']
                enrollment_status = result['status']
                
                # Calculate automatic remarks if not provided
                if not remarks and prelim is not None and midterm is not None and final is not None:
                    remarks = calculate_remarks(prelim, midterm, final, enrollment_status)
                elif not remarks:
                    remarks = 'Incomplete'
                
                # Check if grade record exists
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
                if remarks == 'Dropped':
                    cursor.execute("""
                        UPDATE enrollment 
                        SET status = 'dropped' 
                        WHERE enrollment_id = %s
                    """, (enrollment_id,))
                elif remarks == 'Competent':
                    cursor.execute("""
                        UPDATE enrollment 
                        SET status = 'completed' 
                        WHERE enrollment_id = %s
                    """, (enrollment_id,))
                elif remarks in ['Not yet competent', 'Incomplete']:
                    # Only update if not already dropped
                    if enrollment_status != 'dropped':
                        cursor.execute("""
                            UPDATE enrollment 
                            SET status = 'enrolled' 
                            WHERE enrollment_id = %s
                        """, (enrollment_id,))
                
                updated_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                continue
        
        db.commit()
        
        response = {
            'success': True,
            'message': f'Successfully updated {updated_count} records',
            'updated': updated_count
        }
        
        if errors:
            response['warnings'] = errors[:10]  # Limit to first 10 errors
            if len(errors) > 10:
                response['warnings'].append(f'... and {len(errors) - 10} more errors')
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': 'File processing error',
            'message': str(e)
        }), 500

# ===================== CERTIFICATE FUNCTIONS =====================
def save_certificate(enrollment_id, name, course, date, cert_hash, file_path):
    file_path = file_path.replace("\\", "/").lstrip("/")
    
    db = get_db()
    cursor = db.cursor()
    
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
    cursor.close()

def draw_curved_text(
    c, text, fontname, fontsize,
    center_x, center_y,
    radius_x, radius_y,
    arc_angle=60, upward=True, letter_spacing=1.2
):
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

def create_certificate(
    recipient_name,
    course_title,
    trainor_user_id,
    output_filename,
    cert_hash=None
):
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
    
    # ========================= PAGE 1 =========================
    c.setStrokeColor(colors.red)
    c.setLineWidth(25)
    c.rect(margin, margin, page_width - 2*margin, page_height - 2*margin)
    
    inset = 20
    c.setLineWidth(2)
    c.rect(margin + inset, margin + inset,
           page_width - 2*margin - inset*2,
           page_height - 2*margin - inset*2)
    
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
    
    # ========================= SIGNATURES =========================
    sign_y = page_height - margin - 500
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT first_name, last_name, signature
        FROM personal_information WHERE user_id=%s
    """, (trainor_user_id,))
    trainor = cursor.fetchone()
    
    cursor.execute("""
        SELECT pi.first_name, pi.last_name, pi.signature
        FROM login l
        JOIN personal_information pi ON l.user_id = pi.user_id
        WHERE l.role='admin'
        ORDER BY l.user_id ASC LIMIT 1
    """)
    admin = cursor.fetchone()
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
    
    # ========================= PAGE 2 (QR VERIFICATION) =========================
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

# ===================== GENERATE CERTIFICATE =====================
@admin_student_grades_bp.route('/student_grades/generate_certificate', methods=['POST'])
def generate_certificate():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    try:
        enrollment_id = request.form['enrollment_id']
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT pi.first_name, pi.last_name,
                   c.class_title, c.instructor_id,
                   sg.remarks, e.status
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN classes c ON e.class_id = c.class_id
            LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.enrollment_id=%s
        """, (enrollment_id,))
        student = cursor.fetchone()
        cursor.close()
        
        if not student or (student['remarks'] != 'Competent' and student['status'] != 'completed'):
            return jsonify({'error': 'Invalid enrollment or student not competent/completed'}), 400
        
        recipient_name = f"{student['first_name']} {student['last_name']}"
        course_title = student['class_title']
        trainor_user_id = student['instructor_id']
        date_completed = datetime.now().strftime('%Y-%m-%d')
        
        CERT_DIR = os.path.join("static", "certs")
        os.makedirs(CERT_DIR, exist_ok=True)
        
        safe_name = recipient_name.replace(" ", "_")
        safe_course = course_title.replace(" ", "_")
        
        cert_filename = f"Certificate_{safe_name}_{safe_course}.pdf"
        cert_path = os.path.join(CERT_DIR, cert_filename)
        
        cert_hash = generate_certificate_hash(
            f"{recipient_name}{course_title}{date_completed}{enrollment_id}"
        )
        
        create_certificate(
            recipient_name,
            course_title,
            trainor_user_id,
            cert_path,
            cert_hash
        )
        
        # Store relative path
        relative_path = f"certs/{cert_filename}"
        
        save_certificate(
            enrollment_id,
            recipient_name,
            course_title,
            date_completed,
            cert_hash,
            relative_path
        )
        
        return jsonify({
            "success": True,
            "file_path": f"/static/{relative_path}",
            "cert_hash": cert_hash
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500