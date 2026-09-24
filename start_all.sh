#!/bin/bash
# Start all services for SIH DR Screening (New Structure)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════"
echo "   SIH DR Screening - Starting All Services"
echo "═══════════════════════════════════════════════"

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo ""
echo "🚀 Starting all services with Docker Compose..."
echo ""

cd "$PROJECT_ROOT"
$DOCKER_COMPOSE up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."

# Wait for AI service
echo "   Waiting for AI service (port 8000)..."
for i in {1..60}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   ✅ AI service is ready!"
        break
    fi
    sleep 2
done

# Wait for Backend service
echo "   Waiting for Backend service (port 5000)..."
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend service is ready!"
        break
    fi
    sleep 2
done

# Wait for Frontend service
echo "   Waiting for Frontend service (port 5173)..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ✅ Frontend service is ready!"
        break
    fi
    sleep 2
done

echo ""
echo "═══════════════════════════════════════════════"
echo "   All services started successfully!"
echo "═══════════════════════════════════════════════"
echo ""
echo "   🤖 AI Service (FastAPI):    http://localhost:8000"
echo "   📚 API Docs:                http://localhost:8000/docs"
echo "   ⚙️  Backend (Express):      http://localhost:5000"
echo "   💚 Health Check:            http://localhost:5000/api/health"
echo "   🌐 Frontend (React):        http://localhost:5173"
echo ""
echo "   To stop:  docker-compose down"
echo "   To logs:  docker-compose logs -f"
echo "═══════════════════════════════════════════════"