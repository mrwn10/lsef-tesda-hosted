from flask import Flask, render_template, session, redirect, url_for, flash
import os
from database import init_app, get_db  # Updated import

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-this-in-production'

# Initialize database with app
init_app(app)

#General BP
from login import login_bp

#General BP
app.register_blueprint(login_bp)

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

# Database Test Route
@app.route("/test-db")
def test_db():
    try:
        db = get_db()
        if db.is_connected():
            return "Database connected successfully!"
    except Exception as e:
        return f"Database connection failed: {str(e)}"

# Health Check Route
@app.route("/health")
def health_check():
    return "Application is running successfully!"

if __name__ == "__main__":
    app.run(debug=True)