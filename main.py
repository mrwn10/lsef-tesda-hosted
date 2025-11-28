from flask import Flask, render_template, session, redirect, url_for, flash
import os
from database import close_db
from flask_mail import Mail

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-this-in-production'

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'marwindalin01@gmail.com'
app.config['MAIL_PASSWORD'] = 'xctm qtyg trwc cjxq'

mail = Mail(app)

#General BP
from register import register
from login import login_bp
from forgot_password import forgot_password_bp
from verify_cert import verify_cert_bp

#General BP
app.register_blueprint(register)
app.register_blueprint(login_bp)
app.register_blueprint(forgot_password_bp)
app.register_blueprint(verify_cert_bp)

#Admin BP
from admin_homepage import admin_homepage_bp

#Admin BP
app.register_blueprint(admin_homepage_bp)

# General Routes
@app.route("/")
def landing():
    return render_template("all/landing_page.html")

@app.route("/register")
def register():
    return render_template("all/register.html")

@app.route("/login")
def login():
    return render_template("all/login.html")

@app.route("/forgot_password")
def forgot_password():
    return render_template("all/forgot_password.html")

@app.route("/program")
def program():
    return render_template("all/program.html")

@app.route("/verify_cert")
def verify_cert():
    return render_template("all/verify_cert.html")

# Admin Routes
@app.route("/admin_homepage")
def admin_homepage():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login'))  # Fixed redirect
    return render_template("admin/admin_homepage.html")  # Added return statement

if __name__ == "__main__":
    app.run(debug=True)