#!/bin/bash
# Start all services for SIH DR Screening

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════"
echo "   SIH DR Screening - Starting All Services"
echo "═══════════════════════════════════════════════"

# 1. Start FastAPI (ML Service) on port 8000
echo ""
echo "🚀 Starting FastAPI ML service on port 8000..."
cd "$PROJECT_ROOT"
source venv/Scripts/activate
python app.py &
FASTAPI_PID=$!
echo "   FastAPI PID: $FASTAPI_PID"

# Wait for FastAPI to be ready
echo "   Waiting for FastAPI to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   ✅ FastAPI is ready!"
        break
    fi
    sleep 1
done

# 2. Start Express Backend on port 5000
echo ""
echo "🚀 Starting Express Backend on port 5000..."
cd "$PROJECT_ROOT/backend"
node src/server.js &
EXPRESS_PID=$!
echo "   Express PID: $EXPRESS_PID"

# 3. Start React Frontend on port 5173
echo ""
echo "🚀 Starting React Frontend on port 5173..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
VITE_PID=$!
echo "   Vite PID: $VITE_PID"

echo ""
echo "═══════════════════════════════════════════════"
echo "   All services started!"
echo "═══════════════════════════════════════════════"
echo ""
echo "   FastAPI (ML):    http://localhost:8000"
echo "   API Docs:        http://localhost:8000/docs"
echo "   Express Backend: http://localhost:5000"
echo "   Health:          http://localhost:5000/api/health"
echo "   Frontend:        http://localhost:5173"
echo ""
echo "   Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════"

# Trap Ctrl+C to kill all processes
trap "kill $FASTAPI_PID $EXPRESS_PID $VITE_PID 2>/dev/null; exit" INT TERM

# Wait for all background processes
wait
