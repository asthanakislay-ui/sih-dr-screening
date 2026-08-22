import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import fundusOriginal from '../assets/fundus-bg.png'
import fundusGradcam from '../assets/mock-fundus-gradcam.svg'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    // Authentication is not implemented yet — this is a placeholder behaviour.
    setSubmitted(true)
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

          {/* <p className="login-lede">
            Explainable AI for diabetic retinopathy screening.
            <br />
            Built for primary care teams in rural India.
          </p>

          <ul className="login-features">
            <li>
              <span className="login-feature-bullet" aria-hidden="true" />
              <div>
                <p className="login-feature-title">AI Classification</p>
                <p className="login-feature-desc">
                  Five-grade DR severity from a single fundus photograph.
                </p>
              </div>
            </li>
            <li>
              <span className="login-feature-bullet" aria-hidden="true" />
              <div>
                <p className="login-feature-title">Model Transparency</p>
                <p className="login-feature-desc">
                  Grad-CAM heatmaps show where the model is looking.
                </p>
              </div>
            </li>
            <li>
              <span className="login-feature-bullet" aria-hidden="true" />
              <div>
                <p className="login-feature-title">Field Ready</p>
                <p className="login-feature-desc">
                  Designed for ASHA workers and PHC clinicians on low bandwidth.
                </p>
              </div>
            </li>
          </ul> */}

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
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@phc.gov.in"
                  className="login-input"
                />
               </div>
                
              </div>

              <div className="login-field">
                <label htmlFor="login-password" className="login-label">
                  <span>Password</span>
                  <a href="#" className="login-link" tabIndex={-1}>
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
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
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
              </div>

              <label className="login-check">
                <input type="checkbox" />
                <span>Keep me signed in on this device</span>
              </label>

              <button
                type="submit"
                className={`login-submit ${submitted ? 'login-submit-sent' : ''}`}
              >
                <span>{submitted ? 'Opening workspace…' : 'Sign in to RETINA'}</span>
                <ArrowRight size={17} strokeWidth={1.9} aria-hidden="true" />
              </button>

              {submitted && (
                <p className="login-temp-note" role="status">
                  Authentication isn&apos;t connected yet — this is a placeholder action.
                </p>
              )}
            </form>

            <div className="login-form-foot">
              <span>New to the programme?</span>
              <a href="#" className="login-link login-link-strong">
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
