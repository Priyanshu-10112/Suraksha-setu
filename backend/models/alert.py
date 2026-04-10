from database import get_connection

def save_alert(camera_id, location, risk, confidence, image_path, message, timestamp, zone_type="normal", alert_type="intrusion"):
    """Save alert to database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO alerts (camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return alert_id

def get_alerts(limit=10):
    """Get recent alerts"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, camera_id, location, risk, confidence, image_path, message, timestamp, zone_type, alert_type
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
            "alert_type": row[9] if len(row) > 9 else "intrusion"
        })
    
    return alerts
