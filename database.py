import mysql.connector
from flask import g, current_app
import os

def get_db():
    if 'db' not in g:
        try:
            g.db = mysql.connector.connect(
                host=os.environ.get('DB_HOST', 'localhost'),
                user=os.environ.get('DB_USER', 'root'),
                password=os.environ.get('DB_PASSWORD', ''),
                database=os.environ.get('DB_NAME', 'lsef_tesda'),
                port=3306
            )
        except mysql.connector.Error as err:
            current_app.logger.error(f"Database connection failed: {err}")
            raise
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None and db.is_connected():
        db.close()

def init_app(app):
    app.teardown_appcontext(close_db)

def save_certificate(enrollment_id, name, course, date, cert_hash, tx_hash, file_path):
    conn = get_db() 
    cursor = conn.cursor()
    query = """
        INSERT INTO certificates (enrollment_id, name, course, date, cert_hash, tx_hash, file_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (enrollment_id, name, course, date, cert_hash, tx_hash, file_path))
        conn.commit()
        return True
    except mysql.connector.Error as err:
        conn.rollback()
        current_app.logger.error(f"Save certificate failed: {err}")
        return False
    finally:
        cursor.close()

def search_certificates_by_name(name):
    conn = get_db() 
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM certificates WHERE name LIKE %s ORDER BY created_at DESC"
    try:
        cursor.execute(query, (f"%{name}%",))
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        current_app.logger.error(f"Search certificates failed: {err}")
        return []
    finally:
        cursor.close()