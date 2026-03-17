from flask import Blueprint, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify
from database import get_db
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import traceback

staff_materials_bp = Blueprint('staff_materials', __name__)

UPLOAD_FOLDER = os.path.join("static", "uploads", "materials")
ALLOWED_EXTENSIONS = {"pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "jpg", "png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@staff_materials_bp.route("/materials", methods=["GET", "POST"])
def materials():
    if "user_id" not in session or session.get("role") != "staff":
        return jsonify({"success": False, "message": "Unauthorized access"}), 401

    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        staff_user_id = session.get("user_id")

        # Get staff profile picture
        profile_picture = "default.png"
        cursor.execute(
            "SELECT profile_picture FROM personal_information WHERE user_id = %s",
            (staff_user_id,)
        )
        user = cursor.fetchone()
        if user and user.get("profile_picture"):
            profile_picture = user["profile_picture"]

        # Handle classwork upload/update
        if request.method == "POST":
            try:
                material_id = request.form.get("material_id")
                title = request.form.get("title")
                description = request.form.get("description")
                class_id = request.form.get("class_id") or None
                
                submission_start_str = request.form.get("submission_start")
                submission_end_str = request.form.get("submission_end")
                
                # Validation
                if not title or not class_id or not submission_start_str or not submission_end_str:
                    return jsonify({"success": False, "message": "All required fields must be filled"}), 400
                
                try:
                    submission_start = datetime.strptime(submission_start_str, '%Y-%m-%dT%H:%M')
                    submission_end = datetime.strptime(submission_end_str, '%Y-%m-%dT%H:%M')
                    
                    # Validate dates
                    now = datetime.now()
                    if submission_start < now:
                        return jsonify({"success": False, "message": "Start date cannot be in the past"}), 400
                    if submission_end <= submission_start:
                        return jsonify({"success": False, "message": "End date must be after start date"}), 400
                except ValueError as e:
                    return jsonify({"success": False, "message": f"Invalid date format: {str(e)}"}), 400

                # File handling
                file = request.files.get("file")
                stored_filename = None
                original_filename = None
                mimetype = None
                file_size = None

                if file and file.filename != '':
                    if not allowed_file(file.filename):
                        return jsonify({"success": False, "message": "File type not allowed. Allowed: PDF, PPT, Word, Excel, JPG, PNG"}), 400
                    
                    file.seek(0, os.SEEK_END)
                    size = file.tell()
                    file.seek(0)
                    if size > MAX_FILE_SIZE:
                        return jsonify({"success": False, "message": "File size exceeds 10MB limit"}), 400
                        
                    original_filename = secure_filename(file.filename)
                    stored_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{original_filename}"
                    filepath = os.path.join(UPLOAD_FOLDER, stored_filename)
                    file.save(filepath)
                    mimetype = file.mimetype
                    file_size = size

                if material_id:  # Update existing material
                    # Verify ownership
                    cursor.execute(
                        "SELECT instructor_id, stored_filename FROM materials WHERE material_id = %s",
                        (material_id,)
                    )
                    material = cursor.fetchone()
                    
                    if not material:
                        return jsonify({"success": False, "message": "Material not found"}), 404
                    
                    if material["instructor_id"] != staff_user_id:
                        return jsonify({"success": False, "message": "Unauthorized to update this material"}), 403
                    
                    # If new file uploaded, delete old one
                    if stored_filename and material.get("stored_filename"):
                        old_file_path = os.path.join(UPLOAD_FOLDER, material["stored_filename"])
                        if os.path.exists(old_file_path):
                            try:
                                os.remove(old_file_path)
                            except Exception as e:
                                print(f"Error deleting old file: {e}")
                    
                    if stored_filename:
                        cursor.execute(
                            """
                            UPDATE materials
                            SET class_id=%s, title=%s, description=%s,
                                original_filename=%s, stored_filename=%s, mimetype=%s, file_size=%s,
                                submission_start=%s, submission_end=%s
                            WHERE material_id=%s AND instructor_id=%s
                            """,
                            (class_id, title, description,
                             original_filename, stored_filename, mimetype, file_size,
                             submission_start, submission_end,
                             material_id, staff_user_id)
                        )
                    else:
                        cursor.execute(
                            """
                            UPDATE materials
                            SET class_id=%s, title=%s, description=%s,
                                submission_start=%s, submission_end=%s
                            WHERE material_id=%s AND instructor_id=%s
                            """,
                            (class_id, title, description, 
                             submission_start, submission_end,
                             material_id, staff_user_id)
                        )
                    db.commit()
                    return jsonify({"success": True, "message": "Classwork updated successfully", "reload": True})
                    
                else:  # Insert new material
                    # Get instructor name
                    cursor.execute(
                        """
                        SELECT first_name, last_name
                        FROM personal_information
                        WHERE user_id = %s
                        """,
                        (staff_user_id,)
                    )
                    instructor = cursor.fetchone()
                    instructor_name = f"{instructor['first_name']} {instructor['last_name']}" if instructor else "Unknown"

                    cursor.execute(
                        """
                        INSERT INTO materials (
                            class_id, instructor_id, instructor_name, title, description, type,
                            original_filename, stored_filename, mimetype, file_size, 
                            submission_start, submission_end, date_uploaded
                        )
                        VALUES (%s, %s, %s, %s, %s, 'classwork', %s, %s, %s, %s, %s, %s, NOW())
                        """,
                        (class_id, staff_user_id, instructor_name, title, description,
                         original_filename, stored_filename, mimetype, file_size,
                         submission_start, submission_end)
                    )
                    db.commit()
                    return jsonify({"success": True, "message": "Classwork uploaded successfully", "reload": True})
                    
            except Exception as e:
                db.rollback()
                print(f"Error in material POST: {traceback.format_exc()}")
                return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

        # GET request - render template
        # Get all classwork materials for this staff
        cursor.execute(
            """
            SELECT m.*, c.class_title,
                   DATE_FORMAT(m.submission_start, '%Y-%m-%dT%H:%i') as submission_start_formatted,
                   DATE_FORMAT(m.submission_end, '%Y-%m-%dT%H:%i') as submission_end_formatted,
                   DATE_FORMAT(m.date_uploaded, '%Y-%m-%d') as date_uploaded_formatted,
                   DATE_FORMAT(m.submission_end, '%M %d, %Y') as submission_end_display
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.class_id
            WHERE m.instructor_id = %s AND m.type = 'classwork'
            ORDER BY m.date_uploaded DESC
            """,
            (staff_user_id,)
        )
        materials = cursor.fetchall()

        # ===== NEW: Get admin announcements (global materials with type='announcement' and class_id IS NULL) =====
        cursor.execute(
            """
            SELECT m.*,
                   DATE_FORMAT(m.date_uploaded, '%Y-%m-%d') as date_uploaded_formatted,
                   DATE_FORMAT(m.date_uploaded, '%M %d, %Y') as date_display
            FROM materials m
            WHERE m.type = 'announcement' AND m.class_id IS NULL
            ORDER BY m.date_uploaded DESC
            """,
        )
        announcements = cursor.fetchall()

        # Get all active classes assigned to this staff
        cursor.execute(
            """
            SELECT 
                c.class_id, 
                c.class_title, 
                c.instructor_name,
                c.schedule,
                c.batch,
                c.school_year,
                (SELECT COUNT(*) FROM enrollment e WHERE e.class_id = c.class_id AND e.status = 'enrolled') as student_count
            FROM classes c
            WHERE c.status IN ('open', 'ongoing') AND c.instructor_id = %s
            ORDER BY c.class_title ASC
            """,
            (staff_user_id,)
        )
        classes = cursor.fetchall()

        return render_template(
            "staffs/staff_materials.html",
            materials=materials,
            announcements=announcements,  # NEW: Pass announcements to template
            classes=classes,
            profile_picture=profile_picture
        )
        
    except Exception as e:
        print(f"Error in materials route: {traceback.format_exc()}")
        if request.method == "POST":
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
        else:
            flash("An error occurred loading the page", "error")
            return render_template("staffs/staff_materials.html", materials=[], announcements=[], classes=[], profile_picture="default.png")
    finally:
        if cursor:
            cursor.close()


@staff_materials_bp.route("/materials/preview/<filename>")
def preview_material(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)
    except Exception as e:
        return jsonify({"success": False, "message": "File not found"}), 404


@staff_materials_bp.route("/materials/check/<int:material_id>")
def check_submissions(material_id):
    if "user_id" not in session or session.get("role") != "staff":
        flash("Unauthorized access. Please login as staff.")
        return redirect(url_for("auth.login"))

    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        staff_user_id = session.get("user_id")
     
        profile_picture = None
        try:
            cursor.execute(
                "SELECT profile_picture FROM personal_information WHERE user_id = %s",
                (staff_user_id,)
            )
            result = cursor.fetchone()
            profile_picture = result["profile_picture"] if result else None
        except Exception:
            profile_picture = None
     
        cursor.execute(
            """
            SELECT m.*, c.class_title,
                   DATE_FORMAT(m.submission_start, '%Y-%m-%d %H:%i') as submission_start_formatted,
                   DATE_FORMAT(m.submission_end, '%Y-%m-%d %H:%i') as submission_end_formatted
            FROM materials m
            LEFT JOIN classes c ON m.class_id = c.class_id
            WHERE m.material_id = %s AND m.instructor_id = %s AND m.type = 'classwork'
            """,
            (material_id, staff_user_id)
        )
        material = cursor.fetchone()

        if not material:
            flash("Invalid classwork or unauthorized access.", "error")
            return redirect(url_for("staff_materials.materials"))
     
        cursor.execute(
            """
            SELECT pi.user_id, pi.first_name, pi.last_name, pi.profile_picture
            FROM enrollment e
            JOIN personal_information pi ON e.user_id = pi.user_id
            WHERE e.class_id = %s AND e.status = 'enrolled'
            """,
            (material["class_id"],)
        )
        enrolled_students = cursor.fetchall()
     
        cursor.execute(
            """
            SELECT s.*, pi.first_name, pi.last_name, pi.profile_picture
            FROM submissions s
            JOIN personal_information pi ON s.student_id = pi.user_id
            WHERE s.material_id = %s
            """,
            (material_id,)
        )
        submissions = cursor.fetchall()

        submitted_ids = {s["student_id"] for s in submissions}

        for student in enrolled_students:
            student["submitted"] = student["user_id"] in submitted_ids
            if student["submitted"]:
                student["submission"] = next(s for s in submissions if s["student_id"] == student["user_id"])

        return render_template(
            "staffs/staff_check.html",
            material=material,
            students=enrolled_students,
            profile_picture=profile_picture   
        )
    except Exception as e:
        print(f"Error in check_submissions: {traceback.format_exc()}")
        flash(f"Error loading submissions: {str(e)}", "error")
        return redirect(url_for("staff_materials.materials"))
    finally:
        if cursor:
            cursor.close()


@staff_materials_bp.route("/materials/delete/<int:material_id>", methods=["POST"])
def delete_material(material_id):
    if "user_id" not in session or session.get("role") != "staff":
        return jsonify({"success": False, "message": "Unauthorized access"}), 401

    db = None
    cursor = None
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # Get file info before deleting
        cursor.execute(
            "SELECT stored_filename FROM materials WHERE material_id = %s AND instructor_id = %s AND type = 'classwork'",
            (material_id, session.get("user_id"))
        )
        material = cursor.fetchone()
        
        if not material:
            return jsonify({"success": False, "message": "Material not found or unauthorized"}), 404
        
        # Delete file if exists
        if material.get("stored_filename"):
            file_path = os.path.join(UPLOAD_FOLDER, material["stored_filename"])
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file: {e}")
        
        # Delete from database
        cursor.execute(
            "DELETE FROM materials WHERE material_id = %s AND instructor_id = %s AND type = 'classwork'",
            (material_id, session.get("user_id"))
        )
        db.commit()
        
        # Check if anything was deleted
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "No material was deleted"}), 404
        
        return jsonify({"success": True, "message": "Classwork deleted successfully", "reload": True})
        
    except Exception as e:
        if db:
            db.rollback()
        print(f"Error in delete_material: {traceback.format_exc()}")
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()