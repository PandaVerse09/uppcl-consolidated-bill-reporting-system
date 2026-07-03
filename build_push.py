#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
import argparse
from pathlib import Path
from datetime import datetime

# Setup paths relative to script location
SCRIPT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = SCRIPT_DIR / "FRONTEND"
BACKEND_DIR = SCRIPT_DIR / "BACKEND"
DIST_SRC = FRONTEND_DIR / "dist"
DIST_DST = BACKEND_DIR / "dist"

DEFAULT_IMAGE_BASE = "uppcl11/cbs-backend"

def run_command(command, cwd=None):
    """Utility to run shell commands cleanly."""
    cmd_str = " ".join(command)
    print(f"Running command: {cmd_str} in {cwd or os.getcwd()}")
    
    # Handle Windows npm execution properly
    if os.name == "nt" and command and command[0] == "npm":
        command[0] = "npm.cmd"
        
    try:
        subprocess.run(command, cwd=str(cwd) if cwd else None, check=True)
    except subprocess.CalledProcessError as err:
        print(f"Error: Command failed: {cmd_str}", file=sys.stderr)
        sys.exit(err.returncode or 1)

def main():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    default_tag = f"1.0.0-{timestamp}"
    
    parser = argparse.ArgumentParser(description="Build UPPCL Consolidated Bill Reporting System.")
    parser.add_argument(
        "--image-name", 
        default=DEFAULT_IMAGE_BASE, 
        help=f"Target docker image base name (default: {DEFAULT_IMAGE_BASE})"
    )
    parser.add_argument(
        "--tag", 
        default=default_tag, 
        help=f"Image tag (default: {default_tag})"
    )
    parser.add_argument(
        "--no-push", 
        action="store_true", 
        help="Skip pushing the Docker image to the registry"
    )
    args = parser.parse_args()

    # 1. Build the Frontend
    print("=== Step 1: Building Frontend ===")
    run_command(["npm", "install"], cwd=FRONTEND_DIR)
    # The build runs without VITE_RUN_ENV=local, ensuring it targets the /revenue/ base path
    run_command(["npm", "run", "build"], cwd=FRONTEND_DIR)

    # 2. Copy Built Frontend Assets to Backend Folder
    print("\n=== Step 2: Copying Static Assets to Backend ===")
    if not DIST_SRC.exists():
        print(f"Error: Built assets directory not found at {DIST_SRC}", file=sys.stderr)
        sys.exit(1)
        
    if DIST_DST.exists():
        print(f"Clearing existing static assets at {DIST_DST}...")
        shutil.rmtree(DIST_DST)
        
    print(f"Copying {DIST_SRC} to {DIST_DST}...")
    shutil.copytree(DIST_SRC, DIST_DST)
    print("Static assets successfully copied.")

    # 3. Build Docker Image
    print("\n=== Step 3: Building Docker Image ===")
    image_tagged = f"{args.image_name}:{args.tag}"
    image_latest = f"{args.image_name}:latest"
    
    # We build the container using BACKEND as the build context
    docker_build_cmd = [
        "docker", "build", 
        "-t", image_tagged,
        "-t", image_latest,
        "-f", str(BACKEND_DIR / "Dockerfile"),
        str(BACKEND_DIR)
    ]
    run_command(docker_build_cmd)

    # 4. Push to Private Registry
    if not args.no_push:
        print("\n=== Step 4: Pushing to UPPCL Private Registry ===")
        run_command(["docker", "push", image_tagged])
        run_command(["docker", "push", image_latest])
        print(f"\nSuccessfully built and pushed:\n - {image_tagged}\n - {image_latest}")
    else:
        print("\n=== Step 4: Skipping Push (Local Build Only) ===")
        print(f"\nSuccessfully built Docker images locally:\n - {image_tagged}\n - {image_latest}")

if __name__ == "__main__":
    main()
