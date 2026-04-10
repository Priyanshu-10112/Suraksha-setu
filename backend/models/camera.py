from database import get_connection

def add_camera(camera_id, source, location, cam_type):
    """Add new camera"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO cameras (camera_id, source, location, type)
        VALUES (?, ?, ?, ?)
    """, (camera_id, source, location, cam_type))
    
    conn.commit()
    conn.close()
    return {"camera_id": camera_id, "source": source, "location": location, "type": cam_type}

def get_all_cameras():
    """Get all cameras"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT camera_id, source, location, type, active FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    
    cameras = []
    for row in rows:
        cameras.append({
            "camera_id": row[0],
            "source": row[1],
            "location": row[2],
            "type": row[3],
            "active": bool(row[4])
        })
    
    return cameras

def get_camera(camera_id):
    """Get single camera"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT camera_id, source, location, type, active FROM cameras WHERE camera_id = ?", (camera_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "camera_id": row[0],
        "source": row[1],
        "location": row[2],
        "type": row[3],
        "active": bool(row[4])
    }

def delete_camera(camera_id):
    """Delete camera and its associated zones"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Delete zones first (foreign key constraint)
    cursor.execute("DELETE FROM zones WHERE camera_id = ?", (camera_id,))
    zones_deleted = cursor.rowcount
    
    # Delete camera
    cursor.execute("DELETE FROM cameras WHERE camera_id = ?", (camera_id,))
    
    conn.commit()
    conn.close()
    
    print(f"🗑️ Deleted camera {camera_id} and {zones_deleted} associated zones")
