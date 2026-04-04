Write-Host "========================================="
Write-Host "📦 Installing All Project Dependencies..."
Write-Host "========================================="

$rootDir = Get-Location

try {
    Write-Host "`n[1/5] Installing axon Frontend..."
    Push-Location "axon-frontend\axon-frontend" -ErrorAction Stop
    npm install
    Pop-Location

    Write-Host "`n[2/5] Installing axon Backend..."
    Push-Location "axon-backend\axon-backend" -ErrorAction Stop
    npm install
    Pop-Location

    Write-Host "`n[3/5] Installing Python Backend..."
    Push-Location "axon-python-backend\axon-python-backend" -ErrorAction Stop
    if (-Not (Test-Path "venv")) {
        Write-Host "Creating virtual environment..."
        python -m venv venv
    }
    Write-Host "Installing python dependencies (this may take a moment)..."
    .\venv\Scripts\python.exe -m pip install -r requirements.txt
    Pop-Location

    Write-Host "`n[4/5] Installing AI Pair Frontend..."
    Push-Location "ai-pair-programming\ai-pair-programming\Frontend" -ErrorAction Stop
    npm install
    Pop-Location

    Write-Host "`n[5/5] Installing AI Pair Backend..."
    Push-Location "ai-pair-programming\ai-pair-programming\Backend" -ErrorAction Stop
    npm install
    Pop-Location

    Write-Host "`n========================================="
    Write-Host "✅ All dependencies installed perfectly!"
    Write-Host "You can now run .\start_all.ps1"
    Write-Host "========================================="
} catch {
    Write-Host "`n❌ An error occurred during installation:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Set-Location $rootDir
    exit 1
}
