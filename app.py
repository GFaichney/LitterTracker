import os
import sqlite3
from contextlib import closing
from datetime import date

from flask import Flask, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "litter_tracker.db")

app = Flask(__name__)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(get_connection()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS litter_trays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                last_scooped_date TEXT NOT NULL,
                last_changed_date TEXT NOT NULL,
                litter_type_description TEXT NOT NULL,
                notes TEXT NOT NULL
            )
            """
        )
        conn.commit()


def normalize_payload(payload: dict) -> dict:
    today = date.today().isoformat()
    return {
        "description": str(payload.get("description", "")).strip(),
        "last_scooped_date": str(payload.get("last_scooped_date", today)).strip() or today,
        "last_changed_date": str(payload.get("last_changed_date", today)).strip() or today,
        "litter_type_description": str(payload.get("litter_type_description", "")).strip(),
        "notes": str(payload.get("notes", "")).strip(),
    }


def validate_payload(payload: dict) -> tuple[bool, str]:
    if not payload["description"]:
        return False, "Description is required."
    if not payload["litter_type_description"]:
        return False, "Litter type description is required."
    return True, ""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/trays", methods=["GET"])
def list_trays():
    with closing(get_connection()) as conn:
        rows = conn.execute(
            """
            SELECT id, description, last_scooped_date, last_changed_date,
                   litter_type_description, notes
            FROM litter_trays
            ORDER BY id DESC
            """
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.route("/api/trays", methods=["POST"])
def create_tray():
    payload = normalize_payload(request.get_json(silent=True) or {})
    is_valid, error = validate_payload(payload)
    if not is_valid:
        return jsonify({"error": error}), 400

    with closing(get_connection()) as conn:
        cursor = conn.execute(
            """
            INSERT INTO litter_trays
            (description, last_scooped_date, last_changed_date, litter_type_description, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["description"],
                payload["last_scooped_date"],
                payload["last_changed_date"],
                payload["litter_type_description"],
                payload["notes"],
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid

    with closing(get_connection()) as conn:
        row = conn.execute(
            """
            SELECT id, description, last_scooped_date, last_changed_date,
                   litter_type_description, notes
            FROM litter_trays
            WHERE id = ?
            """,
            (new_id,),
        ).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/trays/<int:tray_id>", methods=["PUT"])
def update_tray(tray_id: int):
    payload = normalize_payload(request.get_json(silent=True) or {})
    is_valid, error = validate_payload(payload)
    if not is_valid:
        return jsonify({"error": error}), 400

    with closing(get_connection()) as conn:
        existing = conn.execute(
            "SELECT id, last_changed_date FROM litter_trays WHERE id = ?", (tray_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "Litter tray not found."}), 404

        if payload["last_changed_date"] != existing["last_changed_date"]:
            payload["last_scooped_date"] = payload["last_changed_date"]

        conn.execute(
            """
            UPDATE litter_trays
            SET description = ?,
                last_scooped_date = ?,
                last_changed_date = ?,
                litter_type_description = ?,
                notes = ?
            WHERE id = ?
            """,
            (
                payload["description"],
                payload["last_scooped_date"],
                payload["last_changed_date"],
                payload["litter_type_description"],
                payload["notes"],
                tray_id,
            ),
        )
        conn.commit()

    with closing(get_connection()) as conn:
        row = conn.execute(
            """
            SELECT id, description, last_scooped_date, last_changed_date,
                   litter_type_description, notes
            FROM litter_trays
            WHERE id = ?
            """,
            (tray_id,),
        ).fetchone()
    return jsonify(dict(row))


@app.route("/api/trays/<int:tray_id>", methods=["DELETE"])
def delete_tray(tray_id: int):
    with closing(get_connection()) as conn:
        cursor = conn.execute("DELETE FROM litter_trays WHERE id = ?", (tray_id,))
        conn.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Litter tray not found."}), 404
    return "", 204


@app.route("/api/trays/mark-all-scooped", methods=["POST"])
def mark_all_scooped():
    payload = request.get_json(silent=True) or {}
    scooped_date = str(payload.get("last_scooped_date", date.today().isoformat())).strip()
    if not scooped_date:
        scooped_date = date.today().isoformat()

    with closing(get_connection()) as conn:
        cursor = conn.execute(
            "UPDATE litter_trays SET last_scooped_date = ?", (scooped_date,)
        )
        conn.commit()

    return jsonify({"updated_count": cursor.rowcount, "last_scooped_date": scooped_date})


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000, debug=False)
