"""
Lightweight object tracking for intrusion detection
Tracks bounding boxes across frames without heavy models
"""

import numpy as np
from typing import Dict, List, Tuple, Optional

class SimpleTracker:
    """Simple IoU-based tracker for bounding boxes"""
    
    def __init__(self, iou_threshold=0.3, max_age=5, min_hits=3):
        """
        Args:
            iou_threshold: Minimum IoU to consider same object
            max_age: Frames to keep track without detection
            min_hits: Minimum consecutive detections to confirm object
        """
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.min_hits = min_hits
        self.tracks = {}  # track_id -> track_data
        self.next_id = 0
    
    def calculate_iou(self, box1, box2):
        """Calculate Intersection over Union between two boxes"""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        # Intersection
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        
        # Union
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0.0
    
    def update(self, detections: List[Tuple[List[float], float]]):
        """
        Update tracker with new detections
        
        Args:
            detections: List of (bbox, confidence) tuples
            
        Returns:
            List of confirmed tracks: [(track_id, bbox, confidence, hit_count)]
        """
        # Match detections to existing tracks
        matched_tracks = set()
        unmatched_detections = []
        
        for bbox, confidence in detections:
            best_match = None
            best_iou = self.iou_threshold
            
            for track_id, track in self.tracks.items():
                if track_id in matched_tracks:
                    continue
                
                iou = self.calculate_iou(bbox, track['bbox'])
                if iou > best_iou:
                    best_iou = iou
                    best_match = track_id
            
            if best_match is not None:
                # Update existing track
                self.tracks[best_match]['bbox'] = bbox
                self.tracks[best_match]['confidence'] = confidence
                self.tracks[best_match]['hits'] += 1
                self.tracks[best_match]['age'] = 0
                matched_tracks.add(best_match)
            else:
                # New detection
                unmatched_detections.append((bbox, confidence))
        
        # Create new tracks for unmatched detections
        for bbox, confidence in unmatched_detections:
            self.tracks[self.next_id] = {
                'bbox': bbox,
                'confidence': confidence,
                'hits': 1,
                'age': 0
            }
            self.next_id += 1
        
        # Age unmatched tracks
        tracks_to_delete = []
        for track_id, track in self.tracks.items():
            if track_id not in matched_tracks:
                track['age'] += 1
                if track['age'] > self.max_age:
                    tracks_to_delete.append(track_id)
        
        # Remove old tracks
        for track_id in tracks_to_delete:
            del self.tracks[track_id]
        
        # Return confirmed tracks (hit threshold met)
        confirmed = []
        for track_id, track in self.tracks.items():
            if track['hits'] >= self.min_hits:
                confirmed.append((
                    track_id,
                    track['bbox'],
                    track['confidence'],
                    track['hits']
                ))
        
        return confirmed
    
    def reset(self):
        """Reset all tracks"""
        self.tracks = {}
        self.next_id = 0
