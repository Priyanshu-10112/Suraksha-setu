import sqlite3
from pathlib import Path
from config import DB_PATH

def get_connection():
    """Get database connection"""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    """Initialize database tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Cameras table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cameras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT UNIQUE NOT NULL,
            source TEXT NOT NULL,
            location TEXT NOT NULL,
            type TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Zones table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT NOT NULL,
            x1 INTEGER NOT NULL,
            y1 INTEGER NOT NULL,
            x2 INTEGER NOT NULL,
            y2 INTEGER NOT NULL,
            zone_type TEXT DEFAULT 'normal',
            FOREIGN KEY (camera_id) REFERENCES cameras(camera_id)
        )
    """)
    
    # Alerts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT NOT NULL,
            location TEXT NOT NULL,
            risk INTEGER NOT NULL,
            confidence REAL NOT NULL,
            image_path TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            zone_type TEXT DEFAULT 'normal',
            alert_type TEXT DEFAULT 'intrusion',
            status TEXT DEFAULT 'new',
            FOREIGN KEY (camera_id) REFERENCES cameras(camera_id)
        )
    """)
    
    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    
    # Migrate existing zones table if needed
    try:
        cursor.execute("SELECT zone_type FROM zones LIMIT 1")
    except:
        # Column doesn't exist, add it
        print("⚠️ Migrating zones table - adding zone_type column")
        cursor.execute("ALTER TABLE zones ADD COLUMN zone_type TEXT DEFAULT 'normal'")
    
    # Migrate existing alerts table if needed
    try:
        cursor.execute("SELECT zone_type FROM alerts LIMIT 1")
    except:
        print("⚠️ Migrating alerts table - adding zone_type column")
        cursor.execute("ALTER TABLE alerts ADD COLUMN zone_type TEXT DEFAULT 'normal'")
    
    try:
        cursor.execute("SELECT alert_type FROM alerts LIMIT 1")
    except:
        print("⚠️ Migrating alerts table - adding alert_type column")
        cursor.execute("ALTER TABLE alerts ADD COLUMN alert_type TEXT DEFAULT 'intrusion'")
    
    try:
        cursor.execute("SELECT status FROM alerts LIMIT 1")
    except:
        print("⚠️ Migrating alerts table - adding status column")
        cursor.execute("ALTER TABLE alerts ADD COLUMN status TEXT DEFAULT 'new'")
    
    conn.commit()
    conn.close()
