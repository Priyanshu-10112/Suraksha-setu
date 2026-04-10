from database import get_connection
from pathlib import Path
from config import ALERT_STORAGE_PATH

def save_alert(camera_id, location, risk, confidence, image_path, message, timestamp, zone_type="normal", alert_type="intrusion", suspect_name=None, face_confidence=None):
    """Save alert to database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO alerts (camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type, suspect_name, face_confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type, suspect_name, face_confidence))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return alert_id

def get_alerts(limit=10):
    """Get recent alerts"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type, suspect_name, face_confidence
        FROM alerts
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    alerts = []
    for row in rows:
        alerts.append({
            "id": row[0],
            "camera_id": row[1],
            "location": row[2],
            "risk": row[3],
            "confidence": row[4],
            "image_path": row[5],
            "message": row[6],
            "timestamp": row[7],
            "zone_type": row[8] if len(row) > 8 else "normal",
            "alert_type": row[9] if len(row) > 9 else "intrusion",
            "suspect_name": row[10] if len(row) > 10 else None,
            "face_confidence": row[11] if len(row) > 11 else None
        })
    
    return alerts

def delete_alert(alert_id):
    """Delete alert and its image file"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get image path before deletion
    cursor.execute("SELECT image_path FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return {"success": False, "error": "Alert not found"}
    
    image_path = row[0]
    
    # Delete from database
    cursor.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    
    # Delete image file
    image_file = Path(ALERT_STORAGE_PATH) / image_path
    if image_file.exists():
        image_file.unlink()
    
    return {"success": True, "message": "Alert deleted"}

def get_alert_by_id(alert_id):
    """Get single alert by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type, suspect_name, face_confidence
        FROM alerts
        WHERE id = ?
    """, (alert_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "id": row[0],
        "camera_id": row[1],
        "location": row[2],
        "risk": row[3],
        "confidence": row[4],
        "image_path": row[5],
        "message": row[6],
        "timestamp": row[7],
        "zone_type": row[8] if len(row) > 8 else "normal",
        "alert_type": row[9] if len(row) > 9 else "intrusion",
        "suspect_name": row[10] if len(row) > 10 else None,
        "face_confidence": row[11] if len(row) > 11 else None
    }
