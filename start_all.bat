@echo off
REM Start all services for SIH DR Screening (Windows)

echo ═══════════════════════════════════════════════
echo    SIH DR Screening - Starting All Services
echo ═══════════════════════════════════════════════

REM 1. Start FastAPI (ML Service) on port 8000
echo.
echo Starting FastAPI ML service on port 8000...
start "FastAPI" cmd /k "call venv\Scripts\activate && python app.py"

REM Wait a bit for FastAPI to start
timeout /t 5 >nul

REM 2. Start Express Backend on port 5000
echo.
echo Starting Express Backend on port 5000...
start "Express Backend" cmd /k "cd backend && node src/server.js"

REM 3. Start React Frontend on port 5173
echo.
echo Starting React Frontend on port 5173...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ═══════════════════════════════════════════════
echo    All services started in separate windows!
echo ═══════════════════════════════════════════════
echo.
echo    FastAPI (ML):    http://localhost:8000
echo    API Docs:        http://localhost:8000/docs
echo    Express Backend: http://localhost:5000
echo    Health:          http://localhost:5000/api/health
echo    Frontend:        http://localhost:5173
echo.
echo    Close each window to stop the corresponding service.
echo ═══════════════════════════════════════════════
pause
