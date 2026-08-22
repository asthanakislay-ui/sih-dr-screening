import { FileImage, UploadCloud, X, Loader2, AlertCircle } from 'lucide-react'
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
    <div className="mx-auto w-full max-w-[1000px]">
      <section className="mb-8">
        <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">New Screening</h2>
        <p className="mt-1 text-[14px] text-muted">
          Enter patient details and upload a fundus image for screening.
        </p>
      </section>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <section className="border border-line bg-panel p-6 shadow-[0_1px_3px_rgba(32,42,49,0.04)]" aria-labelledby="patient-information-heading">
          <div className="mb-5 border-b border-line pb-4">
            <h3 id="patient-information-heading" className="text-[16px] font-semibold text-ink">Patient Information</h3>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Patient ID" name="patientId" value={fields.patientId} onChange={updateField} error={errors.patientId} />
            <Field label="Full Name" name="fullName" value={fields.fullName} onChange={updateField} error={errors.fullName} />
            <Field label="Age" name="age" type="number" min="1" max="120" value={fields.age} onChange={updateField} error={errors.age} />
            <div>
              <label className="mb-2 block text-[13px] font-medium text-ink" htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={fields.gender} onChange={updateField} className="w-full border border-line bg-panel px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent">
                <option value="">Select gender</option>
                {genderOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.gender && <p className="mt-1.5 text-[12px] text-danger">{errors.gender}</p>}
            </div>
          </div>
        </section>

        <section className="border border-line bg-panel p-6 shadow-[0_1px_3px_rgba(32,42,49,0.04)]" aria-labelledby="fundus-image-heading">
          <div className="mb-5 border-b border-line pb-4">
            <h3 id="fundus-image-heading" className="text-[16px] font-semibold text-ink">Fundus Image</h3>
          </div>
          {!selectedFile ? (
            <button
              type="button"
              className={`flex min-h-[260px] w-full flex-col items-center justify-center border border-dashed px-6 text-center transition-colors ${isDragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent hover:bg-accent-soft'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud size={32} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
              <span className="mt-4 text-[15px] font-semibold text-ink">Upload fundus image</span>
              <span className="mt-1 text-[13px] text-muted">Drag and drop or click to browse</span>
              <span className="mt-3 text-[12px] text-muted">JPG or PNG</span>
            </button>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
              <div className="flex min-w-0 items-center gap-3 border border-line bg-surface p-3">
                <FileImage size={20} className="shrink-0 text-accent" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{selectedFile.name}</p>
                  <p className="mt-1 text-[12px] text-muted">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button type="button" onClick={removeFile} className="ml-auto shrink-0 p-1 text-muted hover:text-danger" aria-label="Remove selected image" title="Remove image">
                  <X size={17} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
              <div className="aspect-[4/3] overflow-hidden border border-line bg-surface">
                <img src={previewUrl} alt="Selected fundus image preview" className="size-full object-contain" />
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
          {errors.image && <p className="mt-2 text-[12px] text-danger">{errors.image}</p>}
          {selectedFile && !errors.image && <p className="mt-4 border-l-2 border-accent bg-accent-soft px-3 py-2.5 text-[13px] text-ink">Image ready for analysis</p>}
        </section>

        {apiError && (
          <div className="flex items-center gap-2 border border-danger bg-[#fff5f5] px-4 py-3 text-[13px] text-danger" role="alert">
            <AlertCircle size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canAnalyze || isAnalyzing}
            className="inline-flex items-center justify-center gap-2 bg-accent px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(23,126,137,0.2)] transition-colors hover:bg-[#126b74] disabled:cursor-not-allowed disabled:bg-[#a8c8cb]"
          >
            {isAnalyzing && <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, min, max }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-ink" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} min={min} max={max} value={value} onChange={onChange} className="w-full border border-line bg-panel px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent" />
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  )
}

export default NewScreeningPage
