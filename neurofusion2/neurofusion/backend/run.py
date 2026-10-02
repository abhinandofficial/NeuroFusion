import uvicorn
import sys
import os

# Ensure backend/app is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

if __name__ == "__main__":
    print("[NeuroFusion] Starting API server on http://localhost:8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
