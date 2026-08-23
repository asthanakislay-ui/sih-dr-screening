import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acceptedImageTypes,
  genderOptions,
  maxImageSize,
  screeningFieldDefaults,
} from '../data/screeningData'
import { predictScreening } from '../services/screeningService'

const initialErrors = {}

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function NewScreeningPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')
  const [fields, setFields] = useState(screeningFieldDefaults)
  const [errors, setErrors] = useState(initialErrors)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const isValidAge = fields.age !== '' && Number(fields.age) >= 1 && Number(fields.age) <= 120
  const canAnalyze = fields.patientId.trim() && fields.fullName.trim() && isValidAge && fields.gender && selectedFile

  function updateField(event) {
    const { name, value } = event.target
    setFields((currentFields) => ({ ...currentFields, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
  }

  function validateFile(file) {
    if (!acceptedImageTypes.includes(file.type)) {
      setErrors((currentErrors) => ({ ...currentErrors, image: 'Please choose a JPG, JPEG, or PNG image.' }))
      return false
    }

    if (file.size > maxImageSize) {
      setErrors((currentErrors) => ({ ...currentErrors, image: 'Image must be smaller than 10 MB.' }))
      return false
    }

    setErrors((currentErrors) => ({ ...currentErrors, image: '' }))
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = URL.createObjectURL(file)
    setPreviewUrl(previewUrlRef.current)
    setSelectedFile(file)
    return true
  }

  function handleFileChange(event) {
    const [file] = event.target.files
    if (file) validateFile(file)
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    const [file] = event.dataTransfer.files
    if (file) validateFile(file)
  }

  function removeFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setSelectedFile(null)
    setPreviewUrl('')
    setErrors((currentErrors) => ({ ...currentErrors, image: '' }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!fields.patientId.trim()) nextErrors.patientId = 'Patient ID is required.'
    if (!fields.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!isValidAge) nextErrors.age = 'Enter an age between 1 and 120.'
    if (!fields.gender) nextErrors.gender = 'Select a gender.'
    if (!selectedFile) nextErrors.image = 'Please select a fundus image.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsAnalyzing(true)
    setApiError('')

    try {
      // Convert the selected file to base64 for storage
      const originalImageBase64 = await fileToBase64(selectedFile)

      const result = await predictScreening(selectedFile)
      // Store result, patient data, AND original image in sessionStorage for the result page
      sessionStorage.setItem('screeningResult', JSON.stringify({
        result,
        patient: {
          id: fields.patientId,
          name: fields.fullName,
          age: fields.age,
          gender: fields.gender,
        },
        screeningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        originalImageBase64,
      }))
      navigate('/analysis-result')
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1]) // Remove data URL prefix
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="ns-shell">
      <div className="ns-container">
        <header className="ns-header">
          <h1 className="ns-title">New Screening</h1>
          <p className="ns-subtitle">Enter patient details and upload a fundus image for analysis.</p>
        </header>

        <form className="ns-form" onSubmit={handleSubmit} noValidate>
          <section className="ns-card" aria-labelledby="patient-information-heading">
            <h2 id="patient-information-heading" className="ns-card-title">Patient Information</h2>

            <div className="ns-fields">
              <Field label="Patient ID" name="patientId" value={fields.patientId} onChange={updateField} error={errors.patientId} />
              <Field label="Full Name" name="fullName" value={fields.fullName} onChange={updateField} error={errors.fullName} />
              <Field label="Age" name="age" type="number" min="1" max="120" value={fields.age} onChange={updateField} error={errors.age} />
              <div>
                <label className="ns-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={fields.gender}
                  onChange={updateField}
                  className="ns-input"
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.gender && <p className="ns-error">{errors.gender}</p>}
              </div>
            </div>
          </section>

          <section className="ns-card" aria-labelledby="fundus-image-heading">
            <h2 id="fundus-image-heading" className="ns-card-title">Fundus Image</h2>

            {!selectedFile ? (
              <button
                type="button"
                className={`ns-dropzone ${isDragging ? 'is-dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <UploadCloud size={24} strokeWidth={1.6} className="ns-dropzone-icon" aria-hidden="true" />
                <span className="ns-dropzone-title">Upload fundus image</span>
                <span className="ns-dropzone-sub">Drag and drop or click to browse</span>
                <span className="ns-dropzone-meta">JPG or PNG</span>
              </button>
            ) : (
              <div className="ns-preview">
                <div className="ns-preview-image">
                  <img src={previewUrl} alt="Selected fundus image preview" />
                </div>
                <div className="ns-preview-meta">
                  <p className="ns-preview-name">{selectedFile.name}</p>
                  <p className="ns-preview-size">{formatFileSize(selectedFile.size)}</p>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="ns-remove"
                    aria-label="Remove selected image"
                    title="Remove image"
                  >
                    <X size={14} strokeWidth={2} aria-hidden="true" />
                    Remove image
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
            {errors.image && <p className="ns-error ns-error--block">{errors.image}</p>}
          </section>

          {apiError && (
            <div className="ns-api-error" role="alert">
              <AlertCircle size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="ns-actions">
            <button
              type="submit"
              disabled={!canAnalyze || isAnalyzing}
              className="ns-submit"
            >
              {isAnalyzing && <Loader2 size={15} strokeWidth={2} className="animate-spin" aria-hidden="true" />}
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Image'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, min, max }) {
  return (
    <div>
      <label className="ns-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="ns-input"
      />
      {error && <p className="ns-error">{error}</p>}
    </div>
  )
}

export default NewScreeningPage
