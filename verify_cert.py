 
from flask import Blueprint, render_template, request
from database import get_db

verify_cert_bp = Blueprint(
    'verify_cert',
    __name__,
    url_prefix=""
)
 
@verify_cert_bp.route("/verify_cert", methods=["GET"])
def verify_cert_form():
    return render_template("all/verify_cert.html")
 
@verify_cert_bp.route("/verify_cert/check", methods=["POST"])
def verify_cert_check():
    cert_hash = request.form.get("cert_hash", "").strip()

    if not cert_hash:
        return render_template(
            "all/verify_result.html",
            error="⚠️ Please enter a certificate hash."
        )

    return _verify_and_render(cert_hash)
 
@verify_cert_bp.route("/verify-certificate/<cert_hash>", methods=["GET"])
def verify_from_qr(cert_hash):
    return _verify_and_render(cert_hash)
 
def _verify_and_render(cert_hash):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT enrollment_id, name, course, date, cert_hash, file_path
        FROM certificates
        WHERE cert_hash = %s
    """, (cert_hash,))

    cert = cursor.fetchone()

    cursor.close()
    db.close()

    if cert:
        return render_template(
            "all/verify_result.html",
            certificate=cert
        )

    return render_template(
        "all/verify_result.html",
        error="❌ Invalid or unrecognized certificate hash."
    )
