from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
ASSETS = FRONTEND / "assets"
ANIMALS = ASSETS / "animals"
INDEX_FILE = FRONTEND / "index.html"

ALLOWED_ANIMALS = {"cat", "dog", "elephant"}

app = FastAPI(title="Animal Picker + File Uploader")

# If you host frontend elsewhere, tighten/adjust these origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Serve static assets (css, js, images)
app.mount("/assets", StaticFiles(directory=str(ASSETS)), name="assets")

@app.get("/", include_in_schema=False)
async def index():
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=500, detail="index.html missing")
    return FileResponse(str(INDEX_FILE))

@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}

@app.get("/api/animal")
async def get_animal(name: str = Query(..., description="One of: cat, dog, elephant")):
    name = name.lower().strip()
    if name not in ALLOWED_ANIMALS:
        raise HTTPException(status_code=400, detail=f"Invalid animal '{name}'. Allowed: {sorted(ALLOWED_ANIMALS)}")
    img_path = ANIMALS / f"{name}.svg"
    if not img_path.exists():
        raise HTTPException(status_code=500, detail=f"Missing image {img_path.name}")
    # We return a JSON pointing to the static image for the frontend to render
    return JSONResponse({"imageUrl": f"/assets/animals/{name}.svg", "label": name.capitalize()})

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    # Read file content to compute size (in memory for demo purposes)
    try:
        content = await file.read()
    finally:
        await file.close()
    size = len(content) if content is not None else 0
    return {"name": file.filename, "size": size, "type": file.content_type or ""}
