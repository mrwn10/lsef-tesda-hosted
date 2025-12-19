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


staff_class_student_management_bp = Blueprint('staff_class_student_management', __name__)

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

# ---------------- FONT REGISTRATION ----------------
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))  # Chinese font
OFL_FONT_PATH = os.path.join("static", "fonts", "UnifrakturCook-Bold.ttf")
if os.path.exists(OFL_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("UnifrakturCook", OFL_FONT_PATH))
    except Exception as e:
        print("Failed to register UnifrakturCook:", e)
else:
    print("Font file not found:", OFL_FONT_PATH)

# ===================== CALCULATE REMARKS AUTOMATICALLY =====================
def calculate_remarks(prelim, midterm, final):
    """
    Automatically calculate remarks based on grades
    Rules:
    - All three grades must be provided
    - Average >= 75: Passed
    - Average < 75: Failed
    - Any missing grade: Incomplete
    """
    if prelim is None or midterm is None or final is None:
        return "Incomplete"
    
    try:
        prelim = float(prelim)
        midterm = float(midterm)
        final = float(final)
        
        average = (prelim + midterm + final) / 3
        
        if average >= 75:
            return "Passed"
        else:
            return "Failed"
    except (ValueError, TypeError):
        return "Incomplete"



# ===================== VIEW CLASS STUDENTS =====================
@staff_class_student_management_bp.route('/staff_class/<int:class_id>/students', methods=['GET'])
def view_class_students(class_id):
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)
    staff_user_id = session.get('user_id')

    # Fetch staff profile picture
    profile_picture = 'default.png'
    if staff_user_id:
        cursor.execute("""
            SELECT profile_picture FROM personal_information WHERE user_id = %s
        """, (staff_user_id,))
        user = cursor.fetchone()
        if user and user.get('profile_picture'):
            profile_picture = user['profile_picture']

    # Fetch enrolled students
    cursor.execute("""
        SELECT 
            pi.first_name, 
            pi.last_name, 
            l.email, 
            l.user_id AS user_id, 
            sg.prelim_grade, 
            sg.midterm_grade, 
            sg.final_grade, 
            sg.remarks,
            e.enrollment_id
        FROM enrollment e
        JOIN login l ON e.user_id = l.user_id
        JOIN personal_information pi ON l.user_id = pi.user_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE e.class_id = %s AND e.status = 'enrolled'
    """, (class_id,))
    students = cursor.fetchall()

    # Calculate automatic remarks for display
    for student in students:
        auto_remarks = calculate_remarks(
            student.get('prelim_grade'),
            student.get('midterm_grade'),
            student.get('final_grade')
        )
        student['auto_remarks'] = auto_remarks

    return render_template(
        'staffs/staff_class_student_management.html',
        students=students,
        class_id=class_id,
        profile_picture=profile_picture
    )

# ===================== EDIT STUDENT GRADE =====================
@staff_class_student_management_bp.route('/staff_student/edit_grade', methods=['POST'])
def edit_student_grade():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.json
    enrollment_id = data.get('enrollment_id')
    prelim = data.get('prelim_grade')
    midterm = data.get('midterm_grade')
    final = data.get('final_grade')
    remarks = data.get('remarks')
    use_auto_remarks = data.get('use_auto_remarks', False)

    # Calculate automatic remarks if requested
    if use_auto_remarks:
        remarks = calculate_remarks(prelim, midterm, final)

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM student_grades WHERE enrollment_id = %s", (enrollment_id,))
    grade = cursor.fetchone()

    if grade:
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

    db.commit()

    return jsonify({
        'message': 'Grade and remarks updated successfully',
        'auto_remarks': calculate_remarks(prelim, midterm, final) if use_auto_remarks else None
    })

# ===================== GET AUTO REMARKS =====================
@staff_class_student_management_bp.route('/staff_student/get_auto_remarks', methods=['POST'])
def get_auto_remarks():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.json
    prelim = data.get('prelim_grade')
    midterm = data.get('midterm_grade')
    final = data.get('final_grade')
    
    auto_remarks = calculate_remarks(prelim, midterm, final)
    
    return jsonify({
        'auto_remarks': auto_remarks,
        'success': True
    })

# ===================== STUDENT PROFILE =====================
@staff_class_student_management_bp.route('/staff_student_profile/<int:user_id>', methods=['GET'])
def get_student_profile(user_id):
    if 'user_id' not in session or session.get('role') != 'staff':
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

        # Enrolled Classes
        cursor.execute("""
            SELECT 
                c.class_id, c.class_title, c.schedule, c.days_of_week, c.venue,
                c.start_date, c.end_date, c.instructor_name,
                e.enrollment_id, e.status AS enrollment_status,
                sg.final_grade, sg.remarks, sg.date_recorded AS grade_date
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

        # Certificates - NOW INCLUDING NAME
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

# ===================== DOWNLOAD GRADE SHEET =====================
@staff_class_student_management_bp.route('/staff_class/<int:class_id>/download_grades', methods=['GET'])
def download_grade_sheet(class_id):
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            pi.first_name AS First_Name,
            pi.last_name AS Last_Name,
            l.email AS Email,
            sg.prelim_grade AS Prelim_Grade,
            sg.midterm_grade AS Midterm_Grade,
            sg.final_grade AS Final_Grade,
            sg.remarks AS Remarks
        FROM enrollment e
        JOIN login l ON e.user_id = l.user_id
        JOIN personal_information pi ON l.user_id = pi.user_id
        LEFT JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
        WHERE e.class_id = %s AND e.status = 'enrolled'
    """, (class_id,))
    
    students = cursor.fetchall()
    df = pd.DataFrame(students)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Grades')
    output.seek(0)

    return send_file(output, download_name=f'class_{class_id}_grades.xlsx', as_attachment=True)

# ===================== UPLOAD GRADE SHEET =====================
@staff_class_student_management_bp.route('/staff_class/<int:class_id>/upload_grades', methods=['POST'])
def upload_grade_sheet(class_id):
    if 'user_id' not in session or session.get('role') != 'staff':
        flash('Unauthorized access.', 'error')
        return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

    file = request.files.get('file')
    if not file or file.filename == '':
        flash('No file provided.', 'error')
        return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

    try:
        df = pd.read_excel(file)

        # Replace NaN with None
        df = df.replace({np.nan: None})

        db = get_db()
        cursor = db.cursor()

        for _, row in df.iterrows():
            email = row.get('Email')
            prelim = row.get('Prelim_Grade')
            midterm = row.get('Midterm_Grade')
            final = row.get('Final_Grade')
            remarks = row.get('Remarks')

            if not email:
                continue  # skip invalid rows

            # Calculate automatic remarks if not provided
            if not remarks and prelim is not None and midterm is not None and final is not None:
                remarks = calculate_remarks(prelim, midterm, final)

            cursor.execute("""
                SELECT e.enrollment_id 
                FROM enrollment e
                JOIN login l ON e.user_id = l.user_id
                WHERE l.email = %s AND e.class_id = %s
            """, (email, class_id))
            result = cursor.fetchone()

            if result:
                enrollment_id = result[0]

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

        db.commit()
        flash('Grades successfully uploaded.', 'success')

    except Exception as e:
        flash(f'Error processing file: {str(e)}', 'error')

    return redirect(url_for('staff_class_student_management.view_class_students', class_id=class_id))

# ===================== CERTIFICATE FUNCTIONS =====================
def generate_private_certificate_hash(content):
    return hashlib.sha256(content.encode()).hexdigest()

def save_private_certificate(enrollment_id, name, course, date, cert_hash, file_path):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT id FROM certificates WHERE enrollment_id=%s AND course=%s
    """, (enrollment_id, course))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE certificates SET name=%s, cert_hash=%s, file_path=%s, date=%s, created_at=NOW()
            WHERE id=%s
        """, (name, cert_hash, file_path, date, existing[0]))
    else:
        cursor.execute("""
            INSERT INTO certificates (enrollment_id, name, course, date, cert_hash, file_path, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,NOW())
        """, (enrollment_id, name, course, date, cert_hash, file_path))
    db.commit()
    cursor.close()

# ---------------- CURVED TEXT FUNCTION ----------------
def draw_curved_text(c, text, fontname, fontsize, center_x, center_y, radius_x, radius_y, arc_angle=60, upward=True, letter_spacing=1.2):
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
        if upward:
            x = center_x + radius_x * math.sin(rad)
            y = center_y + radius_y * math.cos(rad)
            rotation = -angle
        else:
            x = center_x + radius_x * math.sin(rad)
            y = center_y - radius_y * math.cos(rad)
            rotation = angle
        c.saveState()
        c.translate(x, y)
        c.rotate(rotation)
        c.drawCentredString(0, 0, ch)
        c.restoreState()
        angle += angle_per_char

# ---------------- CREATE PRIVATE CERTIFICATE ----------------
def create_private_completion_certificate(recipient_name, course_title, trainor_user_id, output_filename, cert_hash=None):
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

    # ---------------- BORDERS ----------------
    c.setStrokeColor(colors.red)
    c.setLineWidth(25)
    c.rect(margin, margin, page_width - 2*margin, page_height - 2*margin)
    inset = 20
    c.setLineWidth(2)
    c.rect(margin + inset, margin + inset, page_width - 2*margin - inset*2, page_height - 2*margin - inset*2)

    # ---------------- LOGO ----------------
    logo_path = "static/img/lsef_logo.png"
    if os.path.exists(logo_path):
        c.drawImage(logo_path, center_x - 60, page_height - margin - 75, width=120, height=100, mask="auto")

    # ---------------- HEADER ----------------
    draw_centered_text("菲津富内湖中華學校", "STSong-Light", 30, center_x, page_height - margin - 90, colors.darkred)
    draw_centered_text("Laguna Sino-Filipino Educational Foundation Inc.", "Helvetica-Bold", 25, center_x, page_height - margin - 120)
    draw_centered_text("F. Sario St. Santa Cruz, Laguna", "Helvetica", 18, center_x, page_height - margin - 148)

    # ---------------- CURVED TITLE ----------------
    draw_curved_text(c, "Certificate of Completion", "UnifrakturCook", 60, center_x, page_height - margin - 420, radius_x=520, radius_y=200)

    # ---------------- COURSE & RECIPIENT ----------------
    draw_centered_text(course_title, "Helvetica-Bold", 24, center_x, page_height - margin - 260)
    draw_centered_text("This certificate is proudly awarded to", "Helvetica", 18, center_x, page_height - margin - 295)
    draw_centered_text(recipient_name, "UnifrakturCook", 50, center_x, page_height - margin - 365)
    c.line(center_x - 220, page_height - margin - 370, center_x + 220, page_height - margin - 370)
    draw_centered_text("In recognition of your dedication, passion and hard work", "Helvetica", 18, center_x, page_height - margin - 410)

    # ---------------- SIGNATURES ----------------
    sign_y = page_height - margin - 500
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT first_name, last_name, signature FROM personal_information WHERE user_id=%s", (trainor_user_id,))
    trainor = cursor.fetchone()
    cursor.close()

    trainor_name = "Trainor"
    signature_path = None
    if trainor:
        trainor_name = f"{trainor['first_name']} {trainor['last_name']}"
        if trainor['signature']:
            sig_candidate = os.path.join("static", "uploads", "signatures", trainor["signature"])
            if os.path.exists(sig_candidate):
                signature_path = sig_candidate

    # Trainor line & signature
    left_x1, left_x2 = margin + 85, margin + 265
    c.line(left_x1, sign_y + 20, left_x2, sign_y + 20)
    if signature_path:
        with Image.open(signature_path) as img:
            max_w, max_h = 160, 50
            ratio = min(max_w / img.width, max_h / img.height)
            w, h = img.width*ratio, img.height*ratio
            x = left_x1 + ((left_x2 - left_x1)-w)/2
            c.drawImage(ImageReader(img), x, sign_y + 30, w, h, mask="auto")
    draw_centered_text(trainor_name, "Helvetica-Bold", 18, margin + 175, sign_y + 25)
    draw_centered_text("Trainor", "Helvetica", 15, margin + 175, sign_y + 3)

    # Chairman line
    right_x1, right_x2 = page_width - margin - 265, page_width - margin - 85
    c.line(right_x1, sign_y + 20, right_x2, sign_y + 20)
    draw_centered_text("Enrico Ariel T. Ting", "Helvetica-Bold", 18, page_width - margin - 175, sign_y + 25)
    draw_centered_text("Chairman, BOT", "Helvetica", 15, page_width - margin - 175, sign_y + 3)

    # ---------------- HASH ----------------
    if cert_hash:
        draw_centered_text(f"Verification Hash: {cert_hash}", "Helvetica", 9, center_x, margin + 35, colors.gray)

    c.save()

# ---------------- ROUTE ----------------
@staff_class_student_management_bp.route('/generate_private_completion', methods=['POST'])
def generate_private_completion():
    if 'user_id' not in session or session.get('role') != 'staff':
        return jsonify({'error': 'Unauthorized access'}), 403
    try:
        enrollment_id = request.form['enrollment_id']
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT pi.first_name, pi.last_name, c.class_title, c.instructor_id, sg.remarks
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            JOIN classes c ON e.class_id = c.class_id
            JOIN student_grades sg ON e.enrollment_id = sg.enrollment_id
            WHERE e.enrollment_id=%s
        """, (enrollment_id,))
        student = cursor.fetchone()
        cursor.close()

        if not student:
            return jsonify({'error': 'Not Found', 'message': 'Enrollment not found'}), 404
        if student['remarks'] != 'Completed':
            return jsonify({'error': 'Bad Request', 'message': 'Student has not completed the course'}), 400

        recipient_name = f"{student['first_name']} {student['last_name']}"
        course_title = student['class_title']
        trainor_user_id = student['instructor_id']
        date_completed = datetime.now().strftime('%Y-%m-%d')

        # Certificate directory & filename
        CERT_DIR = os.path.join('static', 'certs')
        os.makedirs(CERT_DIR, exist_ok=True)
        sanitized_name = "".join(c for c in recipient_name if c.isalnum() or c in (' ', '_')).strip()
        sanitized_course = "".join(c for c in course_title if c.isalnum() or c in (' ', '_')).strip()
        cert_filename = f"Private_Completion_{sanitized_name.replace(' ','_')}_{sanitized_course.replace(' ','_')}.pdf"
        cert_path = os.path.join(CERT_DIR, cert_filename)

        # Certificate hash
        cert_hash = generate_private_certificate_hash(f"{recipient_name}{course_title}{date_completed}{enrollment_id}")

        # Generate PDF
        create_private_completion_certificate(recipient_name, course_title, trainor_user_id, cert_path, cert_hash)

        # Save to DB
        file_path = os.path.join("certs", cert_filename).replace("\\", "/")
        save_private_certificate(enrollment_id, recipient_name, course_title, date_completed, cert_hash, file_path)

        return jsonify({'success': True, 'message': 'Private Completion Certificate generated successfully!', 'file_path': os.path.join('static', file_path).replace("\\","/"), 'cert_hash': cert_hash})

    except Exception as e:
        return jsonify({'error': 'Server Error', 'message': f'Error generating private certificate: {str(e)}'}), 500

