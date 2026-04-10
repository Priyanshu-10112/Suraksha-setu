"""
Advanced zone intersection utilities
Provides precise zone overlap calculations
"""

def calculate_intersection_over_area(bbox, zone):
    """
    Calculate Intersection over Area (IoA) - what % of bbox is inside zone
    
    Args:
        bbox: [x1, y1, x2, y2]
        zone: dict with x1, y1, x2, y2
    
    Returns:
        float: Percentage of bbox inside zone (0.0 to 1.0)
    """
    bx1, by1, bx2, by2 = bbox
    zx1, zy1, zx2, zy2 = zone["x1"], zone["y1"], zone["x2"], zone["y2"]
    
    # Calculate intersection
    inter_x1 = max(bx1, zx1)
    inter_y1 = max(by1, zy1)
    inter_x2 = min(bx2, zx2)
    inter_y2 = min(by2, zy2)
    
    # No intersection
    if inter_x2 < inter_x1 or inter_y2 < inter_y1:
        return 0.0
    
    # Intersection area
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    
    # Bounding box area
    bbox_area = (bx2 - bx1) * (by2 - by1)
    
    if bbox_area == 0:
        return 0.0
    
    return inter_area / bbox_area

def is_inside_zone_precise(bbox, zone, ioa_threshold=0.3):
    """
    Check if bbox is inside zone with precision threshold
    
    Args:
        bbox: [x1, y1, x2, y2]
        zone: dict with x1, y1, x2, y2, zone_type
        ioa_threshold: Minimum overlap required (0.3 = 30%)
    
    Returns:
        bool: True if sufficient overlap
    """
    ioa = calculate_intersection_over_area(bbox, zone)
    return ioa >= ioa_threshold

def apply_zone_margin(zone, margin_percent=0.05):
    """
    Shrink zone by margin to avoid boundary triggers
    
    Args:
        zone: dict with x1, y1, x2, y2
        margin_percent: Percentage to shrink (0.05 = 5%)
    
    Returns:
        dict: Zone with adjusted boundaries
    """
    width = zone["x2"] - zone["x1"]
    height = zone["y2"] - zone["y1"]
    
    margin_x = width * margin_percent
    margin_y = height * margin_percent
    
    return {
        **zone,
        "x1": zone["x1"] + margin_x,
        "y1": zone["y1"] + margin_y,
        "x2": zone["x2"] - margin_x,
        "y2": zone["y2"] - margin_y
    }
