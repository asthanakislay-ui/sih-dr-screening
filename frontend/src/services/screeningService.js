// screeningService.js
//
// Thin service layer that talks to the FastAPI DR screening backend.
// Only sends the uploaded image; does not invent fields the backend
// does not return. Errors are surfaced to the caller as plain Error
// instances with helpful messages — never silently swallowed.

// Use Vite environment variable with fallback for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const PREDICT_URL = `${API_BASE_URL}/predict`

/**
 * Submit a fundus image to the backend for DR grading + Grad-CAM overlay.
 *
 * @param {File|Blob} file - The image to analyze (PNG / JPG / JPEG).
 *   Must be supplied by the caller as the actual File object from an
 *   <input type="file" /> or a drag-drop event — not a path or URL.
 * @returns {Promise<{
 *   class_idx: number,
 *   class_name: string,
 *   confidence: number,
 *   all_probs: number[],
 *   heatmap_base64: string,
 *   processing_time_ms: number,
 * }>}
 *   Resolves with the backend's response verbatim. No extra fields
 *   are fabricated here.
 * @throws {Error} With a `.status` property when the backend returns a
 *   non-2xx response (400, 500, etc.), or without `.status` when the
 *   network call itself fails (backend unreachable, CORS, abort, etc.).
 */
export async function predictScreening(file) {
  if (!file) {
    throw new Error('No file provided to predictScreening')
  }

  const formData = new FormData()
  // Field name MUST be exactly "file" — matches the backend's UploadFile.
  formData.append('file', file)

  let response
  try {
    response = await fetch(PREDICT_URL, {
      method: 'POST',
      body: formData,
      // Do NOT set 'Content-Type' here — the browser must add the
      // multipart boundary itself for FormData uploads.
    })
  } catch (networkError) {
    // fetch() rejects on connectivity failures (backend down, DNS,
    // CORS preflight rejection that didn't surface as a status, etc.).
    throw new Error(
      `Could not reach the screening API at ${PREDICT_URL}. ` +
        `Is the backend running? (${networkError.message})`,
    )
  }

  if (!response.ok) {
    // Backend returns {"detail": {"error": "..."}} for 400 and
    // {"detail": "Model inference error: ..."} for 500. Try to
    // surface that detail; fall back to status + statusText.
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

    const message =
      detail ||
      `Screening API returned HTTP ${response.status} ${response.statusText}`

    const err = new Error(message)
    err.status = response.status
    throw err
  }

  // Happy path: parse and return the contract fields the backend
  // promises. We don't reshape, rename, or augment the response.
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

// DR severity classes, in the exact order the backend emits them.
// 0 = No DR, 1 = Mild, 2 = Moderate, 3 = Severe, 4 = Proliferative.
// Referable DR is class_idx >= 2.
export const DR_CLASSES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
export const REFERABLE_THRESHOLD = 2
