# Login Issue — Fixes for Web Developer

**Date:** 2026-09-23  
**Status:** ⚠️ Not Working — Backend auth exists but frontend integration has gaps  
**Assigned To:** Web Developer Teammate

---

## 🎯 Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Backend `/api/auth/login` | ✅ Implemented | `POST /api/auth/login` returns `{ success, user, token }` |
| Backend `/api/auth/register` | ✅ Implemented | `POST /api/auth/register` returns `{ success, user, token }` |
| Backend JWT (`generateToken`) | ✅ Implemented | `backend/src/utils/generateToken.js` |
| Backend `protect` middleware | ✅ Implemented | `backend/src/middleware/auth.middleware.js` |
| Frontend `LoginPage.jsx` | 🟡 UI Complete | Form validation, role selector, loading states |
| Frontend `AuthContext.jsx` | 🟡 Partial | Calls `login()` from `screeningService` |
| Frontend `screeningService.login()` | ✅ Implemented | Calls `POST ${BACKEND_BASE_URL}/api/auth/login` |
| **Frontend ↔ Backend wiring** | ❌ **Broken** | See issues below |

---

## 🔴 Root Cause: 3 Critical Issues

### Issue 1: Frontend `signIn` sends `role` but Backend ignores it

**File:** `frontend/src/context/AuthContext.jsx` (line 49-66)

```javascript
const signIn = useCallback(async ({ email, password, role }) => {
  try {
    const data = await login(email, password)  // ← role NOT passed!
    // ...
    setActiveRole(role || userRole)  // ← uses local role, not DB role
  }
}, [])
```

**File:** `frontend/src/services/screeningService.js` (line 79-97)

```javascript
export async function login(email, password) {
  // ...
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),  // ← role missing!
  })
  // ...
}
```

**Backend expects:** `{ email, password, role }` (see `auth.controller.js` line 63-65)
**Frontend sends:** `{ email, password }` — **role is dropped**

---

### Issue 2: CORS — Backend only allows `FRONTEND_URL` from env

**File:** `backend/src/app.js` (line 15-35)

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];
```

**Problem:** If `FRONTEND_URL` isn't set in `backend/.env`, it defaults to `http://localhost:5173`. This works locally but will fail in Docker (where frontend is on `http://localhost:5173` but backend sees origin as `http://frontend:5173` or similar).

---

### Issue 3: MongoDB Connection Required — No Users Exist

**File:** `backend/.env.example`

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
```

**Problem:** Backend needs MongoDB running. Without it:
- `/api/auth/register` fails (can't create user)
- `/api/auth/login` fails (no users to authenticate)
- No fallback/demo mode exists

---

## ✅ Required Fixes

### Fix 1: Pass `role` from Frontend to Backend Login

**File:** `frontend/src/services/screeningService.js`

```diff
export async function login(email, password, role = 'clinician') {
  // ...
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
-   body: JSON.stringify({ email, password }),
+   body: JSON.stringify({ email, password, role }),
  })
  // ...
}
```

**File:** `frontend/src/context/AuthContext.jsx`

```diff
const signIn = useCallback(async ({ email, password, role }) => {
  try {
-   const data = await login(email, password)
+   const data = await login(email, password, role)
    // ...
  }
}, [])
```

---

### Fix 2: Update CORS for Docker + Local Dev

**File:** `backend/src/app.js`

```diff
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
+ 'http://localhost:5173',
+ 'http://127.0.0.1:5173',
+ 'http://frontend:5173',        // Docker service name
+ 'http://localhost:3000',       // Alternative dev port
].filter(Boolean)
```

---

### Fix 3: Add Demo/Dev Mode (No MongoDB Required)

**Option A: Mock User in Backend (Quickest)**

**File:** `backend/src/controllers/auth.controller.js`

```javascript
// Add at top of login()
const DEMO_USERS = {
  'clinician@demo.com': { id: 'demo-1', name: 'Dr. Demo', email: 'clinician@demo.com', role: 'clinician', password: 'demo123' },
  'technician@demo.com': { id: 'demo-2', name: 'Tech Demo', email: 'technician@demo.com', role: 'technician', password: 'demo123' },
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Demo mode fallback
    if (process.env.NODE_ENV !== 'production' && DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      const user = DEMO_USERS[email];
      const token = generateToken(user.id, user.role);
      return res.status(200).json({ success: true, user, token });
    }
    
    // ... existing MongoDB logic
  }
}
```

**Option B: Run MongoDB Locally (Proper Fix)**

```powershell
# Option 1: Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:7

# Option 2: Install MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Then update backend/.env:
MONGO_URI=mongodb://localhost:27017/sih_dr_screening
JWT_SECRET=$(openssl rand -hex 64)
```

---

### Fix 4: Frontend — Store & Use Token for Authenticated Requests

**File:** `frontend/src/services/screeningService.js` — Add token to requests

```diff
export async function saveScreening(formData, token) {
  const response = await fetch(`${API_URL}/screenings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  // ...
}

export async function getScreenings(token) {
  const response = await fetch(`${API_URL}/screenings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  // ...
}
```

**File:** `frontend/src/context/AuthContext.jsx` — Token already stored in session ✅

---

### Fix 5: Frontend — Redirect After Login Works

**File:** `frontend/src/pages/LoginPage.jsx` (line 91)

```diff
await signIn({
  email: email.trim(),
  password,
  role: selectedRole,
})

navigate('/', { replace: true })  // ✅ Already correct
```

**But:** Need to verify `MainLayout.jsx` or `App.jsx` checks auth and redirects unauthenticated users.

---

## 🧪 Test Checklist (After Fixes)

| Test | Command | Expected |
|------|---------|----------|
| Backend health | `curl http://localhost:5000/api/health` | `{"status":"ok"}` |
| Register (demo) | `curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@demo.com","password":"demo123","role":"clinician"}'` | `{"success":true,"user":{...},"token":"..."}` |
| Login (demo) | `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"demo123","role":"clinician"}'` | `{"success":true,"user":{...},"token":"..."}` |
| Frontend login | Open `http://localhost:5173`, enter demo creds | Redirects to `/` (Dashboard) |
| Protected route | Visit `http://localhost:5173/new-screening` after login | Shows page (not redirect to login) |
| Token in requests | Check Network tab on `/api/predict` | `Authorization: Bearer <token>` header present |

---

## 📁 Files to Modify (Priority Order)

| Priority | File | Change |
|----------|------|--------|
| 1 | `frontend/src/services/screeningService.js` | Add `role` to login payload |
| 2 | `frontend/src/context/AuthContext.jsx` | Pass `role` to `login()` |
| 3 | `backend/src/app.js` | Expand CORS origins |
| 4 | `backend/src/controllers/auth.controller.js` | Add demo mode fallback |
| 5 | `backend/.env` | Set `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` |
| 6 | `frontend/src/services/screeningService.js` | Ensure all API calls use token from AuthContext |

---

## 🐳 Docker-Specific Notes

If running via `docker compose`:

1. **Backend `.env`** needs:
   ```env
   MONGO_URI=mongodb://mongodb:27017/sih_dr_screening
   JWT_SECRET=your-secret
   FRONTEND_URL=http://localhost:5173
   ML_SERVICE_URL=http://ai:8000
   ```

2. **Add MongoDB to `docker-compose.yml`:**
   ```yaml
   mongodb:
     image: mongo:7
     container_name: sih-dr-mongodb
     ports: ["27017:27017"]
     volumes: [mongodb_data:/data/db]
     healthcheck:
       test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
       interval: 10s
       timeout: 5s
       retries: 5

   volumes:
     mongodb_data:
   ```

3. **Update backend `depends_on`:**
   ```yaml
   backend:
     depends_on:
       ai:
         condition: service_healthy
       mongodb:
         condition: service_healthy
   ```

---

## 📞 Questions for Team

1. **Demo mode vs real MongoDB?** — Demo mode is faster for hackathon; real MongoDB for production
2. **Role handling:** Should backend enforce role matching? (e.g., clinician can't login as technician)
3. **Token refresh?** — Current JWT expires in 7d (`JWT_EXPIRES_IN=7d`). Need refresh endpoint?
4. **Logout:** Frontend `signOut()` clears localStorage — backend token invalidation not implemented (stateless JWT)

---

## 🔗 Related Files

- `frontend/src/pages/LoginPage.jsx` — Login/Register UI
- `frontend/src/context/AuthContext.jsx` — Auth state management
- `frontend/src/services/screeningService.js` — API service layer
- `backend/src/controllers/auth.controller.js` — Auth logic
- `backend/src/middleware/auth.middleware.js` — JWT verification
- `backend/src/utils/generateToken.js` — Token generation
- `backend/src/app.js` — CORS + route mounting
- `backend/.env.example` — Required env vars

---

**Last Updated:** 2026-09-23  
**Next Step:** Apply Fix 1 & 2 first (minimal changes), test login flow, then add demo mode (Fix 3).