"""
Face Recognition Service for Criminal/Terrorist Detection
Extends intrusion detection with identity-aware threat detection
Uses OpenCV with improved LBP histogram matching
"""
import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import os

# Global storage for criminal dataset
criminal_face_data = []  # List of (name, face_descriptor)
dataset_loaded = False

# Configuration
DATASET_PATH = Path(__file__).parent.parent / "dataset" / "criminals"
FACE_MATCH_THRESHOLD = 0.80  # Very strict - only very high confidence matches

# Load OpenCV face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def extract_face_features(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract face features using LBP histogram
    
    Args:
        image: Face image (BGR format)
    
    Returns:
        Feature vector or None
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Resize to standard size
        resized = cv2.resize(gray, (128, 128))
        
        # Apply histogram equalization for better contrast
        equalized = cv2.equalizeHist(resized)
        
        # Calculate LBP
        lbp = np.zeros_like(equalized)
        for i in range(1, equalized.shape[0] - 1):
            for j in range(1, equalized.shape[1] - 1):
                center = equalized[i, j]
                code = 0
                code |= (equalized[i-1, j-1] >= center) << 7
                code |= (equalized[i-1, j] >= center) << 6
                code |= (equalized[i-1, j+1] >= center) << 5
                code |= (equalized[i, j+1] >= center) << 4
                code |= (equalized[i+1, j+1] >= center) << 3
                code |= (equalized[i+1, j] >= center) << 2
                code |= (equalized[i+1, j-1] >= center) << 1
                code |= (equalized[i, j-1] >= center) << 0
                lbp[i, j] = code
        
        # Calculate histogram
        hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
        
        # Normalize
        hist = hist.astype(np.float32)
        hist = hist / (hist.sum() + 1e-7)
        
        return hist
        
    except Exception as e:
        print(f"⚠️ Error extracting features: {e}")
        return None


def load_criminal_dataset() -> bool:
    """
    Load criminal face data from dataset folder
    
    Dataset structure:
    dataset/criminals/
        ├── person1_name/
        │   ├── image1.jpg
        │   ├── image2.jpg
        ├── person2_name/
        │   ├── image1.jpg
    
    Returns:
        bool: True if dataset loaded successfully
    """
    global criminal_face_data, dataset_loaded
    
    criminal_face_data = []
    
    if not DATASET_PATH.exists():
        print(f"⚠️ Criminal dataset path not found: {DATASET_PATH}")
        print(f"   Creating directory. Add criminal images to enable face recognition.")
        DATASET_PATH.mkdir(parents=True, exist_ok=True)
        dataset_loaded = False
        return False
    
    person_folders = [f for f in DATASET_PATH.iterdir() if f.is_dir()]
    
    if not person_folders:
        print(f"⚠️ No criminal profiles found in {DATASET_PATH}")
        print(f"   Add subfolders with person names containing their images.")
        dataset_loaded = False
        return False
    
    print(f"🔍 Loading criminal dataset from {DATASET_PATH}")
    
    total_images = 0
    total_faces = 0
    
    for person_folder in person_folders:
        person_name = person_folder.name
        image_files = list(person_folder.glob("*.jpg")) + \
                     list(person_folder.glob("*.jpeg")) + \
                     list(person_folder.glob("*.png"))
        
        if not image_files:
            print(f"   ⚠️ No images found for {person_name}")
            continue
        
        person_features = []
        
        for image_path in image_files:
            total_images += 1
            try:
                # Load image
                image = cv2.imread(str(image_path))
                if image is None:
                    print(f"   ⚠️ Could not load {image_path.name}")
                    continue
                
                # Detect faces
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                
                if len(faces) == 0:
                    print(f"   ⚠️ No face found in {image_path.name}")
                    continue
                
                # Use first face
                x, y, w, h = faces[0]
                face_roi = image[y:y+h, x:x+w]
                
                # Extract features
                features = extract_face_features(face_roi)
                if features is not None:
                    person_features.append(features)
                    total_faces += 1
                    
            except Exception as e:
                print(f"   ❌ Error processing {image_path.name}: {e}")
        
        if person_features:
            # Store all features for this person
            for features in person_features:
                criminal_face_data.append((person_name, features))
            
            print(f"   ✅ Loaded {len(person_features)} face(s) for '{person_name}'")
    
    dataset_loaded = len(criminal_face_data) > 0
    
    if dataset_loaded:
        unique_persons = len(set([name for name, _ in criminal_face_data]))
        print(f"✅ Criminal dataset loaded: {unique_persons} persons, {total_faces} faces from {total_images} images")
    else:
        print(f"❌ Failed to load criminal dataset")
    
    return dataset_loaded


def get_face_encoding(frame: np.ndarray, bbox: List[float]) -> Optional[np.ndarray]:
    """
    Extract face features from a cropped bounding box with multiple attempts
    
    Args:
        frame: Full frame image
        bbox: Bounding box [x1, y1, x2, y2]
    
    Returns:
        Face feature vector or None if no face detected
    """
    try:
        x1, y1, x2, y2 = [int(v) for v in bbox]
        
        # Add padding to bbox for better face detection
        padding = 30  # Increased padding
        h, w = frame.shape[:2]
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(w, x2 + padding)
        y2 = min(h, y2 + padding)
        
        # Crop person region
        person_crop = frame[y1:y2, x1:x2]
        
        if person_crop.size == 0:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)
        
        # Try multiple detection parameters
        faces = []
        
        # Attempt 1: Standard detection
        faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
        
        # Attempt 2: More lenient if no face found
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(gray, 1.05, 3, minSize=(20, 20))
        
        # Attempt 3: Very lenient
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(gray, 1.2, 2, minSize=(15, 15))
        
        if len(faces) == 0:
            return None
        
        # Use largest face
        if len(faces) > 1:
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        
        fx, fy, fw, fh = faces[0]
        face_roi = person_crop[fy:fy+fh, fx:fx+fw]
        
        # Extract features
        features = extract_face_features(face_roi)
        return features
        
    except Exception as e:
        print(f"⚠️ Error extracting face encoding: {e}")
        return None


def match_face(face_features: np.ndarray) -> Optional[Dict[str, any]]:
    """
    Match face features against criminal database using histogram comparison
    Very strict matching - only accepts very high confidence matches
    
    Args:
        face_features: Face feature vector (LBP histogram) to match
    
    Returns:
        Dict with match info or None if no match
    """
    global criminal_face_data, dataset_loaded
    
    if not dataset_loaded or not criminal_face_data:
        return None
    
    try:
        best_match_name = None
        best_similarity = 0
        best_index = -1
        second_best_similarity = 0
        
        # Compare with all known criminal faces using multiple methods
        for idx, (name, stored_features) in enumerate(criminal_face_data):
            # Method 1: Correlation
            correlation = cv2.compareHist(
                face_features.astype(np.float32), 
                stored_features.astype(np.float32), 
                cv2.HISTCMP_CORREL
            )
            
            # Method 2: Chi-Square (inverted and normalized)
            chi_square = cv2.compareHist(
                face_features.astype(np.float32), 
                stored_features.astype(np.float32), 
                cv2.HISTCMP_CHISQR
            )
            chi_square_norm = 1.0 / (1.0 + chi_square)
            
            # Method 3: Intersection
            intersection = cv2.compareHist(
                face_features.astype(np.float32), 
                stored_features.astype(np.float32), 
                cv2.HISTCMP_INTERSECT
            )
            
            # Combined similarity (weighted average)
            similarity = (correlation * 0.5) + (chi_square_norm * 0.3) + (intersection * 0.2)
            
            if similarity > best_similarity:
                second_best_similarity = best_similarity
                best_similarity = similarity
                best_match_name = name
                best_index = idx
            elif similarity > second_best_similarity:
                second_best_similarity = similarity
        
        # Check if best match exceeds threshold
        if best_similarity >= FACE_MATCH_THRESHOLD:
            # Additional check: best match should be significantly better than second best
            # This prevents false positives when multiple faces are similar
            confidence_gap = best_similarity - second_best_similarity
            
            if confidence_gap < 0.10:  # If gap is too small, reject
                print(f"⚠️ Ambiguous match: best={best_similarity:.2f}, second={second_best_similarity:.2f}, gap={confidence_gap:.2f} - REJECTED")
                return None
            
            return {
                'name': best_match_name,
                'confidence': float(best_similarity),
                'match_index': best_index,
                'distance': float(1 - best_similarity),
                'confidence_gap': float(confidence_gap)
            }
        
        return None
        
    except Exception as e:
        print(f"⚠️ Error matching face: {e}")
        return None


def is_dataset_loaded() -> bool:
    """Check if criminal dataset is loaded"""
    return dataset_loaded


def get_dataset_info() -> Dict[str, any]:
    """Get information about loaded dataset"""
    unique_persons = list(set([name for name, _ in criminal_face_data]))
    return {
        'loaded': dataset_loaded,
        'total_encodings': len(criminal_face_data),
        'unique_persons': len(unique_persons),
        'persons': unique_persons
    }


def reload_dataset() -> bool:
    """Reload criminal dataset (useful for adding new criminals without restart)"""
    print("🔄 Reloading criminal dataset...")
    return load_criminal_dataset()
