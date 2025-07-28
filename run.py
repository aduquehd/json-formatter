#!/usr/bin/env python3
import subprocess
import sys
import os

def main():
    print("Starting JSON Viewer...")
    
    # Compile TypeScript if needed
    if not os.path.exists("static/js/app.js") or os.path.getmtime("static/ts/app.ts") > os.path.getmtime("static/js/app.js"):
        print("Compiling TypeScript...")
        subprocess.run(["npm", "run", "build"], check=True)
    
    # Start the FastAPI server
    print("Starting server at http://localhost:8000")
    subprocess.run(["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()