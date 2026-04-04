#!/bin/bash

echo "Starting axon Local Services..."
echo "========================================="
echo "Note: Ensure MongoDB is running locally before starting."
sleep 2

# Function to run command in a new Terminal window
run_in_new_terminal() {
    local cmd="$1"
    local escaped_cmd="${cmd//\"/\\\"}"
    osascript -e "tell application \"Terminal\" to do script \"$escaped_cmd\"" > /dev/null
}

ROOT_DIR="$(pwd)"

echo "Starting Python Backend (Port 5005)..."
run_in_new_terminal "cd \"$ROOT_DIR/axon-python-backend/axon-python-backend\" && source venv/bin/activate && uvicorn app.main:app --port 5005 --reload"

echo "Starting axon Node Backend (Port 3000)..."
run_in_new_terminal "cd \"$ROOT_DIR/axon-backend/axon-backend\" && npm run dev"

echo "Starting axon React Frontend (Port 5173)..."
run_in_new_terminal "cd \"$ROOT_DIR/axon-frontend/axon-frontend\" && npm run dev"

echo "Starting AI Pair Programming Backend (Port 3002)..."
run_in_new_terminal "cd \"$ROOT_DIR/ai-pair-programming/ai-pair-programming/Backend\" && npm run start"

echo "Starting AI Pair Programming Frontend (Port 8080)..."
run_in_new_terminal "cd \"$ROOT_DIR/ai-pair-programming/ai-pair-programming/Frontend\" && npm run dev"

echo ""
echo "========================================="
echo "🚀 All 5 services have been launched in separate Terminal windows!"
echo "========================================="
echo "Main Application:       http://localhost:5173"
echo "Node Backend:           http://localhost:3000"
echo "Python Backend:         http://localhost:5005"
echo "AI Pair Programming UI: http://localhost:8080"
echo "AI Pair Backend:        http://localhost:3002"
echo "========================================="
