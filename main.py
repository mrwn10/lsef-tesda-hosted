from flask import Flask, render_template, session, redirect, url_for, flash
from database import get_db

app = Flask(__name__)

#General BP
from login import login_bp

#General BP
app.register_blueprint(login_bp)

#General Route
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

#Admin
@app.route("/admin_homepage")
def admin_homepage():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('You need to login as admin first', 'error')
        return redirect(url_for('login.login_page'))

if __name__ == "__main__":
    app.run(debug=True)