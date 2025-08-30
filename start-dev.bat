@echo off
echo.
echo ========================================
echo   Starting AI Log Analyzer
echo ========================================
echo.

echo Starting Backend Server (Port 3001)...
start "AI Log Analyzer Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server (Port 3000)...
start "AI Log Analyzer Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend:   http://localhost:3000
echo.
echo Two command windows will open:
echo - Backend Server (keep running)
echo - Frontend Server (keep running)
echo.
echo Your browser should automatically open to:
echo http://localhost:3000
echo.
echo Press any key to continue...
pause > nul
