@echo off
echo Starting Workout Tracker...
echo.

start "Backend" cmd /c "cd /d D:\Data\Study\Project\workout-tracker\backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /c "cd /d D:\Data\Study\Project\workout-tracker\frontend && npx vite --host 0.0.0.0"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
