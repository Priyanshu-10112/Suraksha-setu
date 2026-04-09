from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db
from services.websocket import ws_manager
from routes import cameras, zones, alerts, control, stream
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

# Include routers
app.include_router(cameras.router)
app.include_router(zones.router)
app.include_router(alerts.router)
app.include_router(control.router)
app.include_router(stream.router)

@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Suraksha-Setu Backend API",
        "version": "2.0"
    }

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
