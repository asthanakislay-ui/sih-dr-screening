@echo off
REM Start all services for SIH DR Screening (New Structure) - Windows

echo ═══════════════════════════════════════════════
echo    SIH DR Screening - Starting All Services
echo ═══════════════════════════════════════════════

REM Check if docker compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found. Please install Docker Desktop.
    pause
    exit /b 1
)

echo.
echo 🚀 Starting all services with Docker Compose...
echo.

docker compose up --build -d

echo.
echo ⏳ Waiting for services to be healthy...

REM Wait for AI service
echo    Waiting for AI service (port 8000)...
for /l %%i in (1,1,60) do (
    curl -s http://localhost:8000/health >nul 2>&1
    if not errorlevel 1 (
        echo    ✅ AI service is ready!
        goto :backend_wait
    )
    timeout /t 2 >nul
)
echo    ❌ AI service failed to start
goto :error

:backend_wait
REM Wait for Backend service
echo    Waiting for Backend service (port 5000)...
for /l %%i in (1,1,30) do (
    curl -s http://localhost:5000/api/health >nul 2>&1
    if not errorlevel 1 (
        echo    ✅ Backend service is ready!
        goto :frontend_wait
    )
    timeout /t 2 >nul
)
echo    ❌ Backend service failed to start
goto :error

:frontend_wait
REM Wait for Frontend service
echo    Waiting for Frontend service (port 5173)...
for /l %%i in (1,1,30) do (
    curl -s http://localhost:5173 >nul 2>&1
    if not errorlevel 1 (
        echo    ✅ Frontend service is ready!
        goto :success
    )
    timeout /t 2 >nul
)
echo    ❌ Frontend service failed to start
goto :error

:success
echo.
echo ═══════════════════════════════════════════════
echo    All services started successfully!
echo ═══════════════════════════════════════════════
echo.
echo    🤖 AI Service (FastAPI):    http://localhost:8000
echo    📚 API Docs:                http://localhost:8000/docs
echo    ⚙️  Backend (Express):      http://localhost:5000
echo    💚 Health Check:            http://localhost:5000/api/health
echo    🌐 Frontend (React):        http://localhost:5173
echo.
echo    To stop:  docker compose down
echo    To logs:  docker compose logs -f
echo ═══════════════════════════════════════════════
pause
exit /b 0

:error
echo.
echo ❌ One or more services failed to start.
echo    Check logs with: docker compose logs
pause
exit /b 1