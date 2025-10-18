from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import json

# ====== APP SETUP ======
app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app, supports_credentials=True)  # allow cookies/session sharing
app.secret_key = "supersecretkey"  # for session management

# ====== DATABASE SETUP ======
DB_NAME = "shopfolio.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    # Orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ====== ROUTES ======

# Serve index.html and other static files
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# ----- AUTH -----
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    hashed = generate_password_hash(password)
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed))
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, password FROM users WHERE email=?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user and check_password_hash(user[1], password):
        session["user_id"] = user[0]
        session["email"] = email
        return jsonify({"message": "Login successful", "email": email})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})

# ----- PLACE ORDER -----
@app.route("/api/order", methods=["POST"])
def place_order():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    name = data.get("name")
    address = data.get("address")
    payment_method = data.get("payment_method")
    items = data.get("items")
    total = data.get("total")

    if not all([name, address, payment_method, items, total]):
        return jsonify({"error": "All fields are required"}), 400

    # Convert items list/dict to JSON string to store in DB
    items_json = json.dumps(items)

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO orders (user_id, name, address, payment_method, items, total)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session["user_id"], name, address, payment_method, items_json, total))
    conn.commit()
    conn.close()

    return jsonify({"message": "Order placed successfully"})

# ----- GET USER INFO -----
@app.route("/api/me")
def me():
    if "user_id" in session:
        return jsonify({"email": session.get("email")})
    return jsonify({"error": "Not logged in"}), 401

# ----- GET USER ORDERS (optional for future) -----
@app.route("/api/orders")
def get_orders():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, address, payment_method, items, total FROM orders WHERE user_id=?", (session["user_id"],))
    rows = cursor.fetchall()
    conn.close()
    orders = []
    for row in rows:
        orders.append({
            "id": row[0],
            "name": row[1],
            "address": row[2],
            "payment_method": row[3],
            "items": json.loads(row[4]),
            "total": row[5]
        })
    return jsonify({"orders": orders})

# ====== RUN APP ======
if __name__ == "__main__":
    if not os.path.exists("static"):
        os.makedirs("static")
    app.run(debug=True)