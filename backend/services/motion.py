"""
Motion detection to optimize YOLO processing
Only run detection when motion is detected
"""

import cv2
import numpy as np

class MotionDetector:
    """Simple frame differencing motion detector"""
    
    def __init__(self, threshold=25, min_area=500):
        """
        Args:
            threshold: Pixel difference threshold
            min_area: Minimum contour area to consider as motion
        """
        self.threshold = threshold
        self.min_area = min_area
        self.prev_frame = None
    
    def detect(self, frame):
        """
        Detect motion in frame
        
        Args:
            frame: Current frame (BGR)
        
        Returns:
            bool: True if motion detected
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        # First frame
        if self.prev_frame is None:
            self.prev_frame = gray
            return True  # Always process first frame
        
        # Compute difference
        frame_delta = cv2.absdiff(self.prev_frame, gray)
        thresh = cv2.threshold(frame_delta, self.threshold, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Check if any significant motion
        motion_detected = False
        for contour in contours:
            if cv2.contourArea(contour) > self.min_area:
                motion_detected = True
                break
        
        # Update previous frame
        self.prev_frame = gray
        
        return motion_detected
    
    def reset(self):
        """Reset motion detector"""
        self.prev_frame = None
