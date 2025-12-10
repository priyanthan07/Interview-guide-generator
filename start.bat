@echo off
echo ========================================
echo Interview Guide Generator - Startup
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

:: Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Backend...
cd backend

:: Create venv if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv and install dependencies
call venv\Scripts\activate
pip install -r requirements.txt --quiet

:: Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo OPENAI_API_KEY=> .env
    echo DATABASE_URL=sqlite:///./interview_guide.db>> .env
)

:: Seed database if it doesn't exist
if not exist "interview_guide.db" (
    echo Seeding database...
    python seed_data.py
)

:: Start backend in new window
start "Interview Guide - Backend" cmd /k "call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

cd ..

echo Starting Frontend...
cd frontend

:: Install npm dependencies if needed
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)

:: Start frontend in new window
start "Interview Guide - Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to exit this window (servers will keep running)
pause >nul

