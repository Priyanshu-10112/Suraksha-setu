"""
Face Recognition API Routes
Manage criminal dataset and face recognition settings
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List
from services.face_recognition_service import (
    get_dataset_info,
    reload_dataset,
    is_dataset_loaded,
    DATASET_PATH
)
import os
import shutil

router = APIRouter(prefix="/api/face-recognition", tags=["Face Recognition"])

# Alias endpoint for frontend compatibility
criminals_router = APIRouter(prefix="/api/criminals", tags=["Criminals"])

@router.get("/dataset/info")
async def dataset_info():
    """Get information about loaded criminal dataset"""
    info = get_dataset_info()
    return {
        "success": True,
        "dataset": info
    }

@router.post("/dataset/reload")
async def reload_criminal_dataset():
    """Reload criminal dataset (useful after adding new criminals)"""
    success = reload_dataset()
    
    if success:
        info = get_dataset_info()
        return {
            "success": True,
            "message": "Criminal dataset reloaded successfully",
            "dataset": info
        }
    else:
        return {
            "success": False,
            "message": "Failed to reload dataset. Check if dataset folder exists and contains valid images."
        }

@router.get("/status")
async def face_recognition_status():
    """Check if face recognition is active"""
    loaded = is_dataset_loaded()
    info = get_dataset_info()
    
    return {
        "active": loaded,
        "dataset": info,
        "message": "Face recognition is active" if loaded else "Face recognition disabled - no dataset loaded"
    }

# ============================================
# CRIMINALS ENDPOINTS (Frontend Compatibility)
# ============================================

@criminals_router.get("/")
async def get_criminals():
    """Get list of all criminals in database with all photo URLs"""
    info = get_dataset_info()
    
    if not info['loaded']:
        return {
            "success": True,
            "criminals": [],
            "count": 0,
            "message": "No criminals in database"
        }
    
    # Format criminal list with all photos
    criminals = []
    seen = set()
    
    for name in info['persons']:
        if name in seen:
            continue
        seen.add(name)
        
        # Get all photos from criminal's folder
        criminal_folder = DATASET_PATH / name
        photo_urls = []
        
        if criminal_folder.exists():
            # Find all image files
            for ext in ['*.jpg', '*.jpeg', '*.png']:
                photos = list(criminal_folder.glob(ext))
                for photo in photos:
                    photo_urls.append(f"/api/criminals/photo/{name}/{photo.name}")
        
        criminals.append({
            "name": name,
            "display_name": name.replace("_", " "),
            "face_count": info['persons'].count(name),
            "photos": photo_urls,  # All photos
            "photo_url": photo_urls[0] if photo_urls else None  # First photo for backward compatibility
        })
    
    return {
        "success": True,
        "criminals": criminals,
        "count": len(criminals),
        "total_faces": info['total_encodings']
    }

@criminals_router.get("/photo/{criminal_name}/{filename}")
async def get_criminal_photo(criminal_name: str, filename: str):
    """Serve criminal photo"""
    photo_path = DATASET_PATH / criminal_name / filename
    
    if not photo_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return FileResponse(photo_path)

@criminals_router.get("/status")
async def criminals_status():
    """Get criminal detection status (alias for face-recognition/status)"""
    return await face_recognition_status()

@criminals_router.post("/reload")
async def reload_criminals():
    """Reload criminal database (alias for face-recognition/dataset/reload)"""
    success = reload_dataset()
    
    if success:
        info = get_dataset_info()
        return {
            "success": True,
            "message": "Criminal database reloaded successfully",
            "criminals": info['persons'],
            "count": info['unique_persons']
        }
    else:
        return {
            "success": False,
            "message": "Failed to reload criminal database"
        }

@criminals_router.post("/add")
async def add_criminal(
    name: str = Form(...),
    photos: List[UploadFile] = File(...)
):
    """
    Add new criminal with photos
    
    Parameters:
    - name: Criminal name (e.g., "John Doe")
    - photos: List of photo files (jpg, jpeg, png)
    """
    # Validate name
    if not name or len(name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Criminal name is required")
    
    # Clean name (remove special characters, replace spaces with underscores)
    clean_name = name.strip().replace(" ", "_")
    clean_name = "".join(c for c in clean_name if c.isalnum() or c == "_")
    
    if not clean_name:
        raise HTTPException(status_code=400, detail="Invalid criminal name")
    
    # Check if criminal already exists
    criminal_folder = DATASET_PATH / clean_name
    if criminal_folder.exists():
        raise HTTPException(status_code=400, detail=f"Criminal '{name}' already exists")
    
    # Validate photos
    if not photos or len(photos) == 0:
        raise HTTPException(status_code=400, detail="At least one photo is required")
    
    # Validate file types
    allowed_extensions = {'.jpg', '.jpeg', '.png'}
    for photo in photos:
        ext = Path(photo.filename).suffix.lower()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {photo.filename}. Allowed: jpg, jpeg, png"
            )
    
    try:
        # Create criminal folder
        criminal_folder.mkdir(parents=True, exist_ok=True)
        
        # Save photos
        saved_photos = []
        for i, photo in enumerate(photos):
            # Generate filename
            ext = Path(photo.filename).suffix.lower()
            filename = f"photo_{i+1}{ext}"
            file_path = criminal_folder / filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            saved_photos.append(filename)
        
        # Reload dataset to include new criminal
        reload_success = reload_dataset()
        
        if not reload_success:
            # Rollback - delete folder
            shutil.rmtree(criminal_folder)
            raise HTTPException(
                status_code=500, 
                detail="Failed to load criminal faces. Please ensure photos contain clear faces."
            )
        
        return {
            "success": True,
            "message": f"Criminal '{name}' added successfully",
            "criminal": {
                "name": clean_name,
                "display_name": name,
                "photos_count": len(saved_photos),
                "photos": [f"/api/criminals/photo/{clean_name}/{p}" for p in saved_photos]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        if criminal_folder.exists():
            shutil.rmtree(criminal_folder)
        raise HTTPException(status_code=500, detail=f"Failed to add criminal: {str(e)}")

@criminals_router.delete("/{criminal_name}")
async def delete_criminal(criminal_name: str):
    """Delete criminal and all their photos"""
    criminal_folder = DATASET_PATH / criminal_name
    
    if not criminal_folder.exists():
        raise HTTPException(status_code=404, detail=f"Criminal '{criminal_name}' not found")
    
    try:
        # Delete folder and all photos
        shutil.rmtree(criminal_folder)
        
        # Reload dataset
        reload_dataset()
        
        return {
            "success": True,
            "message": f"Criminal '{criminal_name}' deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete criminal: {str(e)}")

@criminals_router.post("/{criminal_name}/photos")
async def add_photos_to_criminal(
    criminal_name: str,
    photos: List[UploadFile] = File(...)
):
    """
    Add more photos to existing criminal
    
    Parameters:
    - criminal_name: Existing criminal name
    - photos: List of photo files to add
    """
    criminal_folder = DATASET_PATH / criminal_name
    
    # Check if criminal exists
    if not criminal_folder.exists():
        raise HTTPException(
            status_code=404, 
            detail=f"Criminal '{criminal_name}' not found. Use POST /api/criminals/add to create new criminal."
        )
    
    # Validate photos
    if not photos or len(photos) == 0:
        raise HTTPException(status_code=400, detail="At least one photo is required")
    
    # Validate file types
    allowed_extensions = {'.jpg', '.jpeg', '.png'}
    for photo in photos:
        ext = Path(photo.filename).suffix.lower()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {photo.filename}. Allowed: jpg, jpeg, png"
            )
    
    try:
        # Get existing photo count
        existing_photos = list(criminal_folder.glob("*.jpg")) + \
                         list(criminal_folder.glob("*.jpeg")) + \
                         list(criminal_folder.glob("*.png"))
        start_index = len(existing_photos) + 1
        
        # Save new photos
        saved_photos = []
        for i, photo in enumerate(photos):
            # Generate filename
            ext = Path(photo.filename).suffix.lower()
            filename = f"photo_{start_index + i}{ext}"
            file_path = criminal_folder / filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            saved_photos.append(filename)
        
        # Reload dataset to include new photos
        reload_success = reload_dataset()
        
        if not reload_success:
            # Rollback - delete new photos
            for photo_name in saved_photos:
                (criminal_folder / photo_name).unlink()
            raise HTTPException(
                status_code=500, 
                detail="Failed to load faces from new photos. Please ensure photos contain clear faces."
            )
        
        return {
            "success": True,
            "message": f"Added {len(saved_photos)} photo(s) to '{criminal_name}'",
            "criminal": {
                "name": criminal_name,
                "photos_added": len(saved_photos),
                "total_photos": len(existing_photos) + len(saved_photos),
                "new_photos": [f"/api/criminals/photo/{criminal_name}/{p}" for p in saved_photos]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add photos: {str(e)}")

@criminals_router.delete("/{criminal_name}/photos/{photo_filename}")
async def delete_criminal_photo(criminal_name: str, photo_filename: str):
    """Delete a specific photo from criminal"""
    photo_path = DATASET_PATH / criminal_name / photo_filename
    
    if not photo_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    try:
        # Check if this is the last photo
        criminal_folder = DATASET_PATH / criminal_name
        existing_photos = list(criminal_folder.glob("*.jpg")) + \
                         list(criminal_folder.glob("*.jpeg")) + \
                         list(criminal_folder.glob("*.png"))
        
        if len(existing_photos) <= 1:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete last photo. Delete the criminal instead."
            )
        
        # Delete photo
        photo_path.unlink()
        
        # Reload dataset
        reload_dataset()
        
        return {
            "success": True,
            "message": f"Photo '{photo_filename}' deleted successfully",
            "remaining_photos": len(existing_photos) - 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete photo: {str(e)}")
