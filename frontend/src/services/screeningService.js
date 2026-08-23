// screeningService.js
//
// Thin service layer that talks to both the FastAPI AI service and the Node/Express backend.
// Errors are surfaced to the caller as plain Error instances with helpful messages.

// Use Vite environment variables with fallbacks for development
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000'
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'

const PREDICT_URL = `${AI_BASE_URL}/predict`
const API_URL = `${BACKEND_BASE_URL}/api`

/**
 * Submit a fundus image to the FastAPI backend for DR grading + Grad-CAM overlay.
 */
export async function predictScreening(file) {
  if (!file) {
    throw new Error('No file provided to predictScreening')
  }

  const formData = new FormData()
  formData.append('file', file)

  let response
  try {
    response = await fetch(PREDICT_URL, {
      method: 'POST',
      body: formData,
    })
  } catch (networkError) {
    throw new Error(
      `Could not reach the AI service at ${PREDICT_URL}. ` +
        `Is the FastAPI service running? (${networkError.message})`,
    )
  }

  if (!response.ok) {
    let detail = ''
    try {
      const errBody = await response.json()
      if (errBody && errBody.detail) {
        detail =
          typeof errBody.detail === 'string'
            ? errBody.detail
            : errBody.detail.error || JSON.stringify(errBody.detail)
      }
    } catch {
      // body wasn't JSON; ignore
    }

    const message = detail || `AI Service returned HTTP ${response.status} ${response.statusText}`
    const err = new Error(message)
    err.status = response.status
    throw err
  }

  const data = await response.json()

  return {
    class_idx: data.class_idx,
    class_name: data.class_name,
    confidence: data.confidence,
    all_probs: data.all_probs,
    heatmap_base64: data.heatmap_base64,
    processing_time_ms: data.processing_time_ms,
  }
}

/**
 * Backend Authentication: Login
 */
export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const errBody = await response.json()
    throw new Error(errBody.message || 'Login failed')
  }

  return response.json() // Returns { success, user, token }
}

/**
 * Backend Authentication: Register
 */
export async function register(name, email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  if (!response.ok) {
    const errBody = await response.json()
    throw new Error(errBody.message || 'Registration failed')
  }

  return response.json()
}

/**
 * Save a screening record to MongoDB.
 * Expects a FormData object containing the image and JSON fields.
 */
export async function saveScreening(formData, token) {
  const response = await fetch(`${API_URL}/screenings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errBody = await response.json()
    throw new Error(errBody.message || 'Failed to save screening')
  }

  return response.json()
}

/**
 * Fetch all screenings for the authenticated user.
 */
export async function getScreenings(token) {
  const response = await fetch(`${API_URL}/screenings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errBody = await response.json()
    throw new Error(errBody.message || 'Failed to fetch screenings')
  }

  return response.json()
}

/**
 * Fetch a single screening by ID.
 */
export async function getScreeningById(id, token) {
  const response = await fetch(`${API_URL}/screenings/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errBody = await response.json()
    throw new Error(errBody.message || 'Failed to fetch screening details')
  }

  return response.json()
}

export const DR_CLASSES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
export const REFERABLE_THRESHOLD = 2
