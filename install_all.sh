#!/bin/bash

echo "========================================="
echo "📦 Installing All Project Dependencies..."
echo "========================================="

# Save the root directory
ROOT_DIR=$(pwd)

# Function to handle errors
handle_error() {
    echo -e "\n❌ An error occurred during installation!"
    cd "$ROOT_DIR" || exit 1
    exit 1
}

# Trap any error
set -e
trap 'handle_error' ERR

echo -e "\n[1/5] Installing axon Frontend..."
cd "axon-frontend/axon-frontend"
npm install
cd "$ROOT_DIR"

echo -e "\n[2/5] Installing axon Backend..."
cd "axon-backend/axon-backend"
npm install
cd "$ROOT_DIR"

echo -e "\n[3/5] Installing Python Backend..."
cd "axon-python-backend/axon-python-backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
echo "Installing python dependencies (this may take a moment)..."
./venv/bin/python3 -m pip install -r requirements.txt
cd "$ROOT_DIR"

echo -e "\n[4/5] Installing AI Pair Frontend..."
cd "ai-pair-programming/ai-pair-programming/Frontend"
npm install
cd "$ROOT_DIR"

echo -e "\n[5/5] Installing AI Pair Backend..."
cd "ai-pair-programming/ai-pair-programming/Backend"
npm install
cd "$ROOT_DIR"

echo -e "\n========================================="
echo "✅ All dependencies installed perfectly!"
echo "========================================="
