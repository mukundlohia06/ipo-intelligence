# IPO Intelligence Terminal - Unified Launcher
Write-Host "Starting IPO Intelligence Terminal..." -ForegroundColor Cyan

# 1. Start Backend on port 8000
Write-Host "Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Users\LENOVO\AppData\Local\Python\bin\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "0.0.0.0" -WorkingDirectory "$PSScriptRoot\backend" -WindowStyle Hidden

# 2. Start Frontend on port 3000
Write-Host "Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "run", "start" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Hidden

Start-Sleep -Seconds 3
Write-Host "Terminal is live at http://localhost:3000/" -ForegroundColor Green
Start-Process "http://localhost:3000/"
