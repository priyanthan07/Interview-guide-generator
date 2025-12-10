#!/bin/bash

echo "========================================"
echo "Interview Guide Generator - Startup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

# Start Backend
echo "Starting Backend..."
cd backend

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
source venv/bin/activate
pip install -r requirements.txt --quiet

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "OPENAI_API_KEY=" > .env
    echo "DATABASE_URL=sqlite:///./interview_guide.db" >> .env
fi

# Seed database if it doesn't exist
if [ ! -f "interview_guide.db" ]; then
    echo "Seeding database..."
    python seed_data.py
fi

# Start backend in background
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================"
echo "Both servers are running..."
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait

