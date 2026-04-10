"""
Noise filters for detection system
Reduces false positives from edge detections, small objects, etc.
"""

def is_near_edge(bbox, frame_shape, edge_margin=0.05):
    """
    Check if bounding box is near frame edges
    
    Args:
        bbox: [x1, y1, x2, y2]
        frame_shape: (height, width)
        edge_margin: Percentage of frame to consider as edge (0.05 = 5%)
    
    Returns:
        True if near edge, False otherwise
    """
    height, width = frame_shape[:2]
    x1, y1, x2, y2 = bbox
    
    margin_x = width * edge_margin
    margin_y = height * edge_margin
    
    # Check if any corner is near edge
    if (x1 < margin_x or x2 > width - margin_x or
        y1 < margin_y or y2 > height - margin_y):
        return True
    
    return False

def is_too_small(bbox, min_width=30, min_height=30):
    """
    Check if bounding box is too small (likely noise or distant object)
    
    Args:
        bbox: [x1, y1, x2, y2]
        min_width: Minimum width in pixels
        min_height: Minimum height in pixels
    
    Returns:
        True if too small, False otherwise
    """
    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    
    return width < min_width or height < min_height

def apply_filters(bbox, frame_shape, config=None):
    """
    Apply all filters to a bounding box
    
    Args:
        bbox: [x1, y1, x2, y2]
        frame_shape: (height, width)
        config: Optional dict with filter settings
    
    Returns:
        True if bbox passes all filters, False otherwise
    """
    if config is None:
        config = {}
    
    edge_margin = config.get('edge_margin', 0.05)
    min_width = config.get('min_width', 30)
    min_height = config.get('min_height', 30)
    
    # Check edge
    if is_near_edge(bbox, frame_shape, edge_margin):
        return False
    
    # Check size
    if is_too_small(bbox, min_width, min_height):
        return False
    
    return True
