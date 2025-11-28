# verify_cert.py
from flask import Blueprint, render_template, request
from database import get_db

# Create Blueprint
verify_cert_bp = Blueprint('verify_cert', __name__, url_prefix="/verify_cert")

# Show verification form
@verify_cert_bp.route("/", methods=["GET"])
def verify_cert_form():
    return render_template("all/verify_cert.html")

# Handle verification
@verify_cert_bp.route("/check", methods=["POST"])
def verify_cert_check():
    cert_hash = request.form.get("cert_hash")  # user input

    if not cert_hash:
        return render_template("all/verify_result.html", error="⚠️ Please enter a certificate hash.")

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM certificates WHERE cert_hash = %s", (cert_hash,))
    cert = cursor.fetchone()

    cursor.close()
    db.close()

    if cert:
        # Show the certificate details + preview
        return render_template("all/verify_result.html", certificate=cert)
    else:
        # Show error if not found
        return render_template("all/verify_result.html", error="❌ Invalid certificate hash. Please check and try again.")
