import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acceptedImageTypes,
  genderOptions,
  maxImageSize,
  screeningFieldDefaults,
} from '../data/screeningData'
import { predictScreening, saveScreening } from '../services/screeningService'
import { useAuth } from '../context/AuthContext'

const initialErrors = {}

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function NewScreeningPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

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
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const isValidAge =
    fields.age !== '' &&
    Number(fields.age) >= 1 &&
    Number(fields.age) <= 120

  const canAnalyze =
    fields.patientId.trim() &&
    fields.fullName.trim() &&
    isValidAge &&
    fields.gender &&
    selectedFile

  function updateField(event) {
    const { name, value } = event.target

    setFields((currentFields) => ({
      ...currentFields,
      [name]: value,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  function validateFile(file) {
    if (!acceptedImageTypes.includes(file.type)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        image: 'Please choose a JPG, JPEG, or PNG image.',
      }))
      return false
    }

    if (file.size > maxImageSize) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        image: 'Image must be smaller than 10 MB.',
      }))
      return false
    }

    setErrors((currentErrors) => ({
      ...currentErrors,
      image: '',
    }))

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    previewUrlRef.current = URL.createObjectURL(file)
    setPreviewUrl(previewUrlRef.current)
    setSelectedFile(file)

    return true
  }

  function handleFileChange(event) {
    const [file] = event.target.files

    if (file) {
      validateFile(file)
    }

    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)

    const [file] = event.dataTransfer.files

    if (file) {
      validateFile(file)
    }
  }

  function removeFile() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    previewUrlRef.current = ''
    setSelectedFile(null)
    setPreviewUrl('')

    setErrors((currentErrors) => ({
      ...currentErrors,
      image: '',
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!fields.patientId.trim()) {
      nextErrors.patientId = 'Patient ID is required.'
    }

    if (!fields.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

    if (!isValidAge) {
      nextErrors.age = 'Enter an age between 1 and 120.'
    }

    if (!fields.gender) {
      nextErrors.gender = 'Select a gender.'
    }

    if (!selectedFile) {
      nextErrors.image = 'Please select a fundus image.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsAnalyzing(true)
    setApiError('')

    try {
      // 1. Run AI prediction
      const result = await predictScreening(selectedFile)

      // 2. Save result to MongoDB
      const formData = new FormData()

      formData.append('image', selectedFile)

      formData.append(
        'patient',
        JSON.stringify({
          id: fields.patientId,
          name: fields.fullName,
          age: Number(fields.age),
          gender: fields.gender,
        }),
      )

      formData.append(
        'screening',
        JSON.stringify({
          drClassIndex: result.class_idx,
          drClassName: result.class_name,
          confidence: result.confidence,
          probabilities: result.all_probs,
          referable: result.class_idx >= 2,
        }),
      )

      formData.append(
        'ai',
        JSON.stringify({
          modelVersion: 'v2.0',
          processingTime: result.processing_time_ms,
        }),
      )

      formData.append('heatmap_base64', result.heatmap_base64)

      const saveResponse = await saveScreening(
        formData,
        session?.token,
      )

      // 3. Navigate to the saved screening result
      navigate(`/analysis-result/${saveResponse.data._id}`)
    } catch (err) {
      setApiError(
        err.message ||
          'An unexpected error occurred. Please try again.',
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="ns-shell">
      <div className="ns-container">
        <header className="ns-header">
          <h1 className="ns-title">New Screening</h1>

          <p className="ns-subtitle">
            Enter patient details and upload a fundus image for analysis.
          </p>
        </header>

        <form
          className="ns-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <section
            className="ns-card"
            aria-labelledby="patient-information-heading"
          >
            <h2
              id="patient-information-heading"
              className="ns-card-title"
            >
              Patient Information
            </h2>

            <div className="ns-fields">
              <Field
                label="Patient ID"
                name="patientId"
                value={fields.patientId}
                onChange={updateField}
                error={errors.patientId}
              />

              <Field
                label="Full Name"
                name="fullName"
                value={fields.fullName}
                onChange={updateField}
                error={errors.fullName}
              />

              <Field
                label="Age"
                name="age"
                type="number"
                min="1"
                max="120"
                value={fields.age}
                onChange={updateField}
                error={errors.age}
              />

              <div>
                <label
                  className="ns-label"
                  htmlFor="gender"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={fields.gender}
                  onChange={updateField}
                  className="ns-input"
                >
                  <option value="">Select gender</option>

                  {genderOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
                </select>

                {errors.gender && (
                  <p className="ns-error">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section
            className="ns-card"
            aria-labelledby="fundus-image-heading"
          >
            <h2
              id="fundus-image-heading"
              className="ns-card-title"
            >
              Fundus Image
            </h2>

            {!selectedFile ? (
              <button
                type="button"
                className={`ns-dropzone ${
                  isDragging ? 'is-dragging' : ''
                }`}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() =>
                  setIsDragging(false)
                }
                onDrop={handleDrop}
              >
                <UploadCloud
                  size={24}
                  strokeWidth={1.6}
                  className="ns-dropzone-icon"
                  aria-hidden="true"
                />

                <span className="ns-dropzone-title">
                  Upload fundus image
                </span>

                <span className="ns-dropzone-sub">
                  Drag and drop or click to browse
                </span>

                <span className="ns-dropzone-meta">
                  JPG or PNG
                </span>
              </button>
            ) : (
              <div className="ns-preview">
                <div className="ns-preview-image">
                  <img
                    src={previewUrl}
                    alt="Selected fundus image preview"
                  />
                </div>

                <div className="ns-preview-meta">
                  <p className="ns-preview-name">
                    {selectedFile.name}
                  </p>

                  <p className="ns-preview-size">
                    {formatFileSize(selectedFile.size)}
                  </p>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="ns-remove"
                    aria-label="Remove selected image"
                    title="Remove image"
                  >
                    <X
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

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

            {errors.image && (
              <p className="ns-error ns-error--block">
                {errors.image}
              </p>
            )}
          </section>

          {apiError && (
            <div
              className="ns-api-error"
              role="alert"
            >
              <AlertCircle
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>{apiError}</span>
            </div>
          )}

          <div className="ns-actions">
            <button
              type="submit"
              disabled={!canAnalyze || isAnalyzing}
              className="ns-submit"
            >
              {isAnalyzing && (
                <Loader2
                  size={15}
                  strokeWidth={2}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}

              <span>
                {isAnalyzing
                  ? 'Analyzing...'
                  : 'Analyze Image'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  min,
  max,
}) {
  return (
    <div>
      <label
        className="ns-label"
        htmlFor={name}
      >
        {label}
      </label>

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

      {error && (
        <p className="ns-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default NewScreeningPage