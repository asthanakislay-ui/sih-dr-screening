import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import fundusOriginal from '../assets/fundus-bg.png'
import fundusGradcam from '../assets/mock-fundus-gradcam.svg'
import { useAuth } from '../context/AuthContext'

// Demo-only authentication. Backend auth is not implemented; any non-empty
// email-shaped identifier and any non-empty password is accepted for the
// purpose of moving the user into the dashboard.
function isValidEmailLike(value) {
  if (!value) return false
  // Accept either a basic email shape or a clinician id (alphanumeric + dash/underscore).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^[A-Za-z0-9_-]{3,}$/.test(value)
}

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function validate() {
    const next = {}
    if (!email.trim()) {
      next.email = 'Enter your email or clinician ID.'
    } else if (!isValidEmailLike(email.trim())) {
      next.email = 'Enter a valid email or clinician ID.'
    }
    if (!password) {
      next.password = 'Enter your password.'
    } else if (password.length < 4) {
      next.password = 'Password must be at least 4 characters.'
    }
    return next
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setSubmitted(true)
    // Demo: small delay so the "Opening workspace…" state is visible.
    setTimeout(() => {
      signIn({ email: email.trim() })
      setIsSubmitting(false)
      navigate('/', { replace: true })
    }, 350)
  }

  return (
    <div className="login-root">
      {/* Large retinal hero image, centered on the viewport */}
      <div className="login-retina-stage" aria-hidden="true">
        <div className="login-retina-frame">
          <img
            src={fundusOriginal}
            alt=""
            className="login-retina-image"
            draggable="false"
          />

          {/* Decorative targeting / analysis marks */}
          <svg
            className="login-retina-overlay"
            viewBox="0 0 800 600"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
          >
            <g
              fill="none"
              stroke="#12C7C8"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            >
              <circle cx="400" cy="300" r="230" opacity="0.18" />
              <circle cx="400" cy="300" r="280" opacity="0.10" />
              <circle cx="400" cy="300" r="2" fill="#12C7C8" stroke="none" opacity="0.9" />
            </g>

            {/* Corner brackets */}
            <g
              fill="none"
              stroke="#12C7C8"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              opacity="0.55"
            >
              <polyline points="120,140 120,100 160,100" />
              <polyline points="640,100 680,100 680,140" />
              <polyline points="120,460 120,500 160,500" />
              <polyline points="640,500 680,500 680,460" />
            </g>

            {/* Thin scan arcs */}
            <g
              fill="none"
              stroke="#12C7C8"
              strokeWidth="1"
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
              opacity="0.35"
            >
              <path d="M 170 300 A 230 230 0 0 1 630 300" />
              <path d="M 200 300 A 200 200 0 0 0 600 300" />
            </g>

            {/* Crosshair tick */}
            <g
              stroke="#12C7C8"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity="0.7"
            >
              <line x1="395" y1="300" x2="405" y2="300" />
              <line x1="400" y1="295" x2="400" y2="305" />
            </g>
          </svg>

          {/* Caption */}
          <div className="login-retina-caption">
            <span className="login-retina-caption-dot" />
            <span>FUNDUS · LIVE PREVIEW</span>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <header className="login-topbar">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#12C7C8" strokeWidth="1.4" />
              <circle cx="16" cy="16" r="8" fill="none" stroke="#12C7C8" strokeWidth="1.4" />
              <circle cx="16" cy="16" r="2" fill="#12C7C8" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="#12C7C8" strokeWidth="1.4" />
              <line x1="16" y1="26" x2="16" y2="30" stroke="#12C7C8" strokeWidth="1.4" />
              <line x1="2" y1="16" x2="6" y2="16" stroke="#12C7C8" strokeWidth="1.4" />
              <line x1="26" y1="16" x2="30" y2="16" stroke="#12C7C8" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="login-brand-name">RETINA</span>
        </div>
        <div className="login-topbar-meta">
          <span className="login-topbar-dot" aria-hidden="true" />
          <span className="login-topbar-text">Clinical Access</span>
        </div>
      </header>

      {/* Editorial + form */}
      <main className="login-stage">
        <section className="login-editorial" aria-label="Product introduction">

          <h1 className="login-headline">
            <span className="login-headline-white">See deeper.</span>
            <span className="login-headline-teal">Screen earlier.</span>
          </h1>

          {/* Model Attention preview */}
          <aside className="login-attention" aria-label="Model attention preview">
            <div className="login-attention-thumb">
              <img src={fundusGradcam} alt="" draggable="false" />
              <span className="login-attention-ring" aria-hidden="true" />
            </div>
            { <div className="login-attention-body">
              <p className="login-attention-label">
                <span className="login-attention-dot" aria-hidden="true" />
                Model Attention
              </p>
              <p className="login-attention-title">Grad-CAM visualization</p>
              <p className="login-attention-desc">for model interpretation.</p>
            </div> }
            <span className="login-attention-arrow" aria-hidden="true">
              <ArrowRight size={16} strokeWidth={1.8} />
            </span>
          </aside>
        </section>

        {/* Translucent login panel */}
        <section className="login-form-wrap" aria-label="Sign in">
          <div className="login-form-card">
            <div className="login-form-meta">
              <span className="login-form-step">01</span>
              <span className="login-form-meta-line" aria-hidden="true" />
              <span className="login-form-meta-label">Secure Sign In</span>
            </div>

            <h2 className="login-form-title">Welcome back, doctor.</h2>
            <p className="login-form-sub">
              Sign in to continue a screening session.
            </p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="login-email" className="login-label">
                  Email or Clinician ID
                </label>
                <div className="login-input-row">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) setErrors((current) => ({ ...current, email: '' }))
                    }}
                    placeholder="name@phc.gov.in"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    className="login-input"
                  />
                </div>
                {errors.email && (
                  <p id="login-email-error" className="login-field-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="login-field">
                <label htmlFor="login-password" className="login-label">
                  <span>Password</span>
                  <a href="#" className="login-link" tabIndex={-1} onClick={(event) => event.preventDefault()}>
                    Forgot?
                  </a>
                </label>
                <div className="login-input-row">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errors.password) setErrors((current) => ({ ...current, password: '' }))
                    }}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    className="login-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="login-visibility"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.6} />
                    ) : (
                      <Eye size={17} strokeWidth={1.6} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="login-field-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <label className="login-check">
                <input type="checkbox" />
                <span>Keep me signed in on this device</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`login-submit ${submitted && !isSubmitting ? 'login-submit-sent' : ''}`}
              >
                <span>{isSubmitting ? 'Opening workspace…' : 'Sign in to RETINA'}</span>
                <ArrowRight size={17} strokeWidth={1.9} aria-hidden="true" />
              </button>

              {submitted && !isSubmitting && (
                <p className="login-temp-note" role="status">
                  Demo session — backend authentication is not connected.
                </p>
              )}
            </form>

            <div className="login-form-foot">
              <span>New to the programme?</span>
              <a href="#" className="login-link login-link-strong" onClick={(event) => event.preventDefault()}>
                Request clinician access
              </a>
            </div>
          </div>

          <p className="login-fineprint">
            For research demonstration only · Not a certified medical device
          </p>
        </section>
      </main>

      {/* Footer bar */}
      <footer className="login-footbar" aria-label="Page footer">
        <span>© 2026 RETINA Consortium</span>
        <span className="login-footbar-sep" aria-hidden="true" />
        <span>Built in India</span>
      </footer>
    </div>
  )
}

export default LoginPage
