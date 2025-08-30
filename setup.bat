@echo off
echo.
echo ========================================
echo   AI Log Analyzer Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found. Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please ensure npm is installed with Node.js
    pause
    exit /b 1
)

echo.
echo Installing root dependencies...
call npm install

echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Creating necessary directories...
if not exist "backend\logs" mkdir "backend\logs"

echo.
echo Setting up environment configuration...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo Environment file created from template.
)

echo.
echo ========================================
echo   Setup completed successfully!
echo ========================================
echo.
echo To start the development servers, run:
echo   npm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo.
echo For more information, check README.md
echo.
pause
