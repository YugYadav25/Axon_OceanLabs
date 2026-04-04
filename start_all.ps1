Write-Host "Starting axon Local Services..."
Write-Host "========================================="
Write-Host "Note: Ensure MongoDB is running locally before starting."
Start-Sleep -Seconds 2

Write-Host "Starting Python Backend (Port 5005)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd axon-python-backend\axon-python-backend; .\venv\Scripts\activate; uvicorn app.main:app --port 5005 --reload"

Write-Host "Starting axon Node Backend (Port 3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd axon-backend\axon-backend; npm run dev"

Write-Host "Starting axon React Frontend (Port 5173)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd axon-frontend\axon-frontend; npm run dev"

Write-Host "Starting AI Pair Programming Backend (Port 3002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-pair-programming\ai-pair-programming\Backend; npm run start"

Write-Host "Starting AI Pair Programming Frontend (Port 8080)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-pair-programming\ai-pair-programming\Frontend; npm run dev"

Write-Host ""
Write-Host "========================================="
Write-Host "🚀 All 5 services have been launched in separate windows!"
Write-Host "========================================="
Write-Host "Main Application:       http://localhost:5173"
Write-Host "Node Backend:           http://localhost:3000"
Write-Host "Python Backend:         http://localhost:5005"
Write-Host "AI Pair Programming UI: http://localhost:8080"
Write-Host "AI Pair Backend:        http://localhost:3002"
Write-Host "========================================="
