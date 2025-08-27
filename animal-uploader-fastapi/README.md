# Animal Picker + File Uploader (FastAPI)

A tiny full‑stack demo: pick one animal (cat, dog, elephant) to display a picture, and upload any file to see its metadata (name, size, MIME type).

## Project structure
```
animal-uploader-fastapi/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── styles.css
│       ├── app.js
│       └── animals/
│           ├── cat.svg
│           ├── dog.svg
│           └── elephant.svg
└── requirements.txt
```

## Run locally
```bash
# 1) Create a virtual environment (optional but recommended)
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2) Install deps
pip install -r requirements.txt

# 3) Start the dev server (auto-reload)
uvicorn backend.main:app --reload

# 4) Open the app
# Visit: http://127.0.0.1:8000
```

## API
- `GET /api/animal?name=cat|dog|elephant` → `{"imageUrl": "/assets/animals/cat.svg", "label": "Cat"}`
- `POST /api/upload` (multipart) with form field `file` → `{"name": "...", "size": 1234, "type": "image/png"}`

Notes:
- For demo, uploaded files are **not persisted**; only metadata is returned.
- In a real system, add limits, validation, and persistent storage.
