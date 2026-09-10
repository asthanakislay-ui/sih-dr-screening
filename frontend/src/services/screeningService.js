
// screeningService.js
//
// Service layer for the FastAPI AI service and Node/Express backend.
// Authentication is temporarily bypassed for development/testing.

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000'
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000'

const PREDICT_URL = `${AI_BASE_URL}/predict`
const API_URL = `${BACKEND_BASE_URL}/api`

/**
 * Submit a fundus image to the FastAPI backend
 * for DR grading + Grad-CAM overlay.
 *
 * This request does not require authentication.
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
      // Response wasn't JSON.
    }

    const message =
      detail ||
      `AI Service returned HTTP ${response.status} ${response.statusText}`

    const error = new Error(message)
    error.status = response.status

    throw error
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
 * Authentication functions are kept for future restoration.
 * They are not required while authentication is bypassed.
 */
export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    let message = 'Login failed'

    try {
      const errBody = await response.json()
      message = errBody.message || message
    } catch {
      // Ignore invalid response body.
    }

    throw new Error(message)
  }

  return response.json()
}

/**
 * Register a new user.
 *
 * Kept for future authentication restoration.
 */
export async function register(name, email, password, role) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      password,
      role,
    }),
  })

  if (!response.ok) {
    let message = 'Registration failed'

    try {
      const errBody = await response.json()
      message = errBody.message || message
    } catch {
      // Ignore invalid response body.
    }

    throw new Error(message)
  }

  return response.json()
}

/**
 * Save a screening record to MongoDB.
 *
 * Authentication is temporarily bypassed.
 * The token parameter is intentionally ignored so existing
 * callers do not have to be changed immediately.
 */
export async function saveScreening(formData, _token) {
  let response

  try {
    response = await fetch(`${API_URL}/screenings`, {
      method: 'POST',
      body: formData,
    })
  } catch (networkError) {
    throw new Error(
      `Could not reach the backend service to save the screening. ` +
        `Please check your connection. (${networkError.message})`,
    )
  }

  if (!response.ok) {
    let message = 'Failed to save screening'

    try {
      const errBody = await response.json()
      message = errBody.message || message
    } catch {
      // Ignore invalid response body.
    }

    throw new Error(message)
  }

  return response.json()
}

/**
 * Fetch all screenings.
 *
 * Authentication is temporarily bypassed.
 */
export async function getScreenings(_token) {
  let response

  try {
    response = await fetch(`${API_URL}/screenings`)
  } catch (networkError) {
    throw new Error(
      `Could not reach the backend service to fetch screening history. ` +
        `(${networkError.message})`,
    )
  }

  if (!response.ok) {
    let message = 'Failed to fetch screenings'

    try {
      const errBody = await response.json()
      message = errBody.message || message
    } catch {
      // Ignore invalid response body.
    }

    throw new Error(message)
  }

  return response.json()
}

/**
 * Fetch a single screening by ID.
 *
 * Authentication is temporarily bypassed.
 */
export async function getScreeningById(id, _token) {
  let response

  try {
    response = await fetch(`${API_URL}/screenings/${id}`)
  } catch (networkError) {
    throw new Error(
      `Could not reach the backend service to fetch the screening result. ` +
        `(${networkError.message})`,
    )
  }

  if (!response.ok) {
    let message = 'Failed to fetch screening details'

    try {
      const errBody = await response.json()
      message = errBody.message || message
    } catch {
      // Ignore invalid response body.
    }

    throw new Error(message)
  }

  return response.json()
}

export const DR_CLASSES = [
  'No DR',
  'Mild',
  'Moderate',
  'Severe',
  'Proliferative',
]

export const REFERABLE_THRESHOLD = 2

