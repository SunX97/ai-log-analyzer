# AI Log Analyzer Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting AI Log Analyzer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

Write-Host "Starting Backend Server (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", 
    "Set-Location '$PSScriptRoot\backend'; npm run dev"
)

Write-Host "Waiting 5 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", 
    "Set-Location '$PSScriptRoot\frontend'; npm start"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Servers Starting Successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:  http://localhost:3001" -ForegroundColor Blue
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Blue
Write-Host ""
Write-Host "Two PowerShell windows will open:" -ForegroundColor Yellow
Write-Host "  - Backend Server (keep this running)" -ForegroundColor White
Write-Host "  - Frontend Server (keep this running)" -ForegroundColor White
Write-Host ""
Write-Host "Your browser should automatically open to:" -ForegroundColor Green
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete! Enjoy your AI Log Analyzer!" -ForegroundColor Green

# Wait a bit more and try to open browser
Start-Sleep -Seconds 10
Write-Host "Opening browser..." -ForegroundColor Cyan
try {
    Start-Process "http://localhost:3000"
} catch {
    Write-Host "Please manually open: http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
