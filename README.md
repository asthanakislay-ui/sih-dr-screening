# SIH Diabetic Retinopathy Screening — Containerized Microservices

A full-stack application for automated diabetic retinopathy (DR) screening using deep learning. Built for the Smart India Hackathon (SIH).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE STACK                         │
├──────────────────┬──────────────────────────────┬──────────────────┤
│     FRONTEND     │           BACKEND            │        AI        │
│  (React + Vite)  │      (Node.js + Express)     │   (FastAPI)      │
│   Port: 5173     │          Port: 5000          │    Port: 8000    │
│                  │                              │                  │
│  • SPA routing   │  • JWT Auth (register/login) │  • PyTorch Model │
│  • Tailwind CSS  │  • MongoDB persistence       │  • EfficientNet  │
│  • Grad-CAM viz  │  • ML Proxy to FastAPI       │  • Grad-CAM      │
│  • i18n (EN/HI)  │  • Screening history         │  • Image valid.  │
└────────┬─────────┴──────────────┬───────────────┴────────┬─────────┘
         │                        │                        │
         │      HTTP + JWT        │   multipart/form-data  │
         └───────────┬────────────┴─────────────┬──────────┘
                     │                          │
                     ▼                          ▼
              ┌─────────────┐           ┌─────────────┐
              │  MongoDB    │           │  PyTorch    │
              │  (Users,    │           │  DR Model   │
              │   Screenings)           │  (.pth)     │
              └─────────────┘           └─────────────┘
```

## Services

| Service | Port | Technology | Responsibility |
|---------|------|------------|----------------|
| **frontend** | 5173 | React 19 + Vite + Tailwind + nginx | SPA, image upload, results visualization, auth UI |
| **backend** | 5000 | Node.js 20 + Express + MongoDB | Auth (JWT), screening CRUD, ML proxy |
| **ai** | 8000 | Python 3.11 + FastAPI + PyTorch | DR classification (5 classes), Grad-CAM heatmaps |

### DR Classification Classes
| Index | Class | Referable |
|-------|-------|-----------|
| 0 | No DR | No |
| 1 | Mild NPDR | No |
| 2 | Moderate NPDR | **Yes** |
| 3 | Severe NPDR | **Yes** |
| 4 | Proliferative DR | **Yes** |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop / Docker Engine ≥ 24.0
- Docker Compose ≥ 2.0
- (Optional) NVIDIA GPU + nvidia-container-toolkit for GPU acceleration

### 1. Clone & Configure
```bash
git clone https://github.com/asthanakislay-ui/sih-dr-screening.git
cd sih-dr-screening
```

### 2. Create Environment File
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your values:
```env
PORT=5000
MONGO_URI=mongodb://host.docker.internal:27017/sih_dr_screening
JWT_SECRET=your_64_char_hex_secret
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://ai:8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=production
```
> **Generate JWT secret:** `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Start MongoDB
You need a MongoDB instance accessible from Docker containers:
- **Local:** `mongod --dbpath /data/db` (use `host.docker.internal` on Mac/Windows)
- **Atlas:** Use your connection string in `MONGO_URI`

### 4. Launch Stack
```bash
docker-compose up --build -d
```

### 5. Verify Services
```bash
# Health checks
curl http://localhost:5173              # Frontend (nginx)
curl http://localhost:5000/api/health   # Backend
curl http://localhost:8000/health       # AI service

# Expected AI response:
# {"status":"ok","model_loaded":true,"weights":"dr_model.pth","device":"cuda"}
```

### 6. Access Application
Open http://localhost:5173 in your browser.

---

## Development Mode (Without Docker)

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | ≥ 18.0.0 |
| Python | ≥ 3.11 |
| MongoDB | ≥ 6.0 |

### 1. AI Service
```bash
cd ai
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with local URLs (http://localhost:8000 for ML_SERVICE_URL)
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
# Create .env with:
# VITE_AI_BASE_URL=http://localhost:8000
# VITE_BACKEND_BASE_URL=http://localhost:5000
npm run dev
```

---

## API Reference

### Authentication (Backend)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Get JWT token |
| GET | `/api/auth/me` | Bearer | Get current user |

### Prediction (Backend → AI Proxy)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/predict` | Bearer | Analyze fundus image |

**Request:** `multipart/form-data` with field `file` (image/jpeg, image/png, ≤10MB)

**Response:**
```json
{
  "success": true,
  "class_name": "Moderate NPDR",
  "confidence": 0.923,
  "heatmap_base64": "data:image/png;base64,...",
  "processing_time_ms": 1234
}
```

### Screenings (Backend)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/screenings` | Bearer | Save screening record |
| GET | `/api/screenings` | Bearer | List user's screenings |
| GET | `/api/screenings/:id` | Bearer | Get single screening |

### Health Checks
| Service | Endpoint |
|---------|----------|
| Frontend | `GET http://localhost:5173` |
| Backend | `GET http://localhost:5000/api/health` |
| Backend → ML | `GET http://localhost:5000/api/health/ml` |
| AI | `GET http://localhost:8000/health` |

---

## Project Structure

```
sih-dr-screening/
├── docker-compose.yml          # Orchestration
├── README.md                   # This file
├── .gitignore                  # Root ignores
│
├── ai/                         # FastAPI ML Service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                  # FastAPI entry point
│   ├── model.py                # DRModel (EfficientNet-B0)
│   ├── gradcam.py              # Grad-CAM implementation
│   ├── image_validator.py      # Fundus image validation
│   ├── measure_api.py          # API metrics/timing
│   ├── weights/
│   │   ├── dr_model.pth        # Trained model weights
│   │   └── dr_model_v1_backup.pth
│   └── .gitignore
│
├── backend/                    # Node.js/Express API
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── app.js              # Express setup
│   │   ├── config/db.js        # MongoDB connection
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, upload, errors
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   └── utils/              # Helpers
│   └── .gitignore
│
├── frontend/                   # React + Vite + nginx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/         # Reusable UI
│   │   ├── pages/              # Route components
│   │   ├── services/           # API clients
│   │   ├── context/            # React context (Auth)
│   │   ├── layouts/            # Page layouts
│   │   ├── locales/            # i18n (EN/HI)
│   │   ├── utils/              # Helpers
│   │   └── assets/             # Static assets
│   └── .gitignore
│
└── simulink/                   # MATLAB/Simulink models (legacy)
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | 64-char hex for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `ML_SERVICE_URL` | No | `http://localhost:8000` | FastAPI base URL |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin |
| `NODE_ENV` | No | `development` | `development` \| `production` |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_AI_BASE_URL` | No | `http://localhost:8000` | Direct AI service URL |
| `VITE_BACKEND_BASE_URL` | No | `http://localhost:5000` | Backend API URL |

---

## Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### AI Service Tests
```bash
cd ai
python -m pytest tests/ -v
```

---

## Deployment Notes

### Production Considerations
1. **Use MongoDB Atlas** or a managed MongoDB instance
2. **Set `NODE_ENV=production`** in backend
3. **Use strong `JWT_SECRET`** (64+ random hex chars)
4. **Configure reverse proxy** (nginx/Traefik) for SSL termination
5. **Set resource limits** in `docker-compose.yml` (already configured: AI 2-4GB RAM)
6. **Enable GPU** for AI service if available:
   ```yaml
   # In docker-compose.yml ai service:
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

### Scaling
- **Frontend:** Stateless nginx — scale horizontally behind load balancer
- **Backend:** Stateless Express — scale horizontally, use sticky sessions or Redis for sessions
- **AI:** GPU-bound — scale vertically or use multiple replicas with GPU sharing

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED 8000` | AI service not healthy — check `docker-compose logs ai` |
| `MongoDB connection failed` | Verify `MONGO_URI` and network access |
| `CORS error` | Ensure `FRONTEND_URL` in backend `.env` matches frontend origin |
| `JWT secret too short` | Generate 64-char hex: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `Image validation failed` | Upload a valid fundus/retinal image (not generic photos) |
| `Out of memory (AI)` | Increase Docker memory limit or use CPU-only PyTorch |

### View Logs
```bash
docker-compose logs -f           # All services
docker-compose logs -f ai        # AI service only
docker-compose logs -f backend   # Backend only
docker-compose logs -f frontend  # Frontend only
```

---

## License

This project was developed for the Smart India Hackathon (SIH). See individual service directories for third-party licenses.

---

## Team

Built by [Team Name] for SIH 2024/2025.