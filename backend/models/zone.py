from database import get_connection

def add_zone(camera_id, x1, y1, x2, y2, zone_type="normal"):
    """Add zone for camera"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO zones (camera_id, x1, y1, x2, y2, zone_type)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (camera_id, x1, y1, x2, y2, zone_type))
    
    zone_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": zone_id, "camera_id": camera_id, "x1": x1, "y1": y1, "x2": x2, "y2": y2, "zone_type": zone_type}

def get_zones(camera_id):
    """Get all zones for camera"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, x1, y1, x2, y2, zone_type FROM zones WHERE camera_id = ?", (camera_id,))
    rows = cursor.fetchall()
    conn.close()
    
    zones = []
    for row in rows:
        zones.append({
            "id": row[0],
            "x1": row[1],
            "y1": row[2],
            "x2": row[3],
            "y2": row[4],
            "zone_type": row[5] if len(row) > 5 else "normal"
        })
    
    return zones

def delete_zone(zone_id):
    """Delete zone"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM zones WHERE id = ?", (zone_id,))
    conn.commit()
    conn.close()
