# Global Configuration

# Detection Settings
CONFIDENCE_THRESHOLD = 0.5  # Minimum confidence for person detection (lowered for better detection)
COOLDOWN_SECONDS = 5  # Seconds between alerts for same camera
FRAME_SKIP = 2  # Process every Nth frame

# Tracking Settings
TRACKING_IOU_THRESHOLD = 0.3  # IoU threshold for same object
TRACKING_MAX_AGE = 5  # Frames to keep track without detection
TRACKING_MIN_HITS = 3  # Minimum consecutive detections to confirm

# Zone Settings
ZONE_IOA_THRESHOLD = 0.15  # Minimum 15% overlap to trigger (lowered for easier detection)
ZONE_MARGIN = 0.05  # Shrink zone by 5% to avoid edges

# Filter Settings
EDGE_MARGIN = 0.0  # Disabled edge filter (was causing too many false rejections)
MIN_BBOX_WIDTH = 30  # Minimum bounding box width in pixels
MIN_BBOX_HEIGHT = 30  # Minimum bounding box height in pixels

# Motion Detection
MOTION_ENABLED = True  # Enable motion-based optimization
MOTION_THRESHOLD = 25  # Pixel difference threshold
MOTION_MIN_AREA = 500  # Minimum contour area for motion

# Risk Scoring
RISK_BASE_MULTIPLIER = 100
RISK_ZONE_BONUS = 20  # Bonus for being fully inside zone
RISK_STABILITY_BONUS = 10  # Bonus for stable tracked object
RISK_EDGE_PENALTY = 10  # Penalty for being near boundary

# Database
DB_PATH = "storage/suraksha.db"

# Storage
ALERT_STORAGE_PATH = "storage/alerts"

# Model
YOLO_MODEL_PATH = "yolov8n.pt"
