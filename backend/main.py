from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db
from services.websocket import ws_manager
from services.face_recognition_service import load_criminal_dataset
from routes import cameras, zones, alerts, control, stream, face_recognition
import uvicorn

app = FastAPI(title="Suraksha-Setu Backend API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve alert images
app.mount("/images", StaticFiles(directory="storage/alerts"), name="images")

# Initialize database
init_db()

# Load criminal dataset
print("=" * 60)
print("🔐 LOADING CRIMINAL FACE RECOGNITION DATABASE")
print("=" * 60)
load_criminal_dataset()
print("=" * 60)

# Include routers
app.include_router(cameras.router)
app.include_router(zones.router)
app.include_router(alerts.router)
app.include_router(control.router)
app.include_router(stream.router)
app.include_router(face_recognition.router)
app.include_router(face_recognition.criminals_router)  # Add criminals endpoint

@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Suraksha-Setu Backend API",
        "version": "2.0"
    }

@app.get("/favicon.ico")
async def favicon():
    return {"message": "No favicon"}

@app.get("/sw.js")
async def service_worker():
    return {"message": "No service worker"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time alerts"""
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
