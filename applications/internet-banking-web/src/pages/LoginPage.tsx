
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './auth.css'

interface LoginResponse {
  accessToken: string
  tokenType: string
  userId: number
  email: string
  role: string
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email address or password.')
        }

        if (response.status === 400) {
          throw new Error('Please check your login details and try again.')
        }

        throw new Error(`Login failed. Server returned ${response.status}.`)
      }

      const data: LoginResponse = await response.json()

      if (!data.accessToken) {
        throw new Error('The server did not return an access token.')
      }

      const normalizedRole = data.role?.toUpperCase().startsWith('ROLE_')
        ? data.role.toUpperCase()
        : `ROLE_${data.role?.toUpperCase()}`

      if (
        normalizedRole !== 'ROLE_STAFF' &&
        normalizedRole !== 'ROLE_CUSTOMER'
      ) {
        throw new Error(
          'Your account role is not permitted to access this application.',
        )
      }

      sessionStorage.setItem('baraza_access_token', data.accessToken)
      sessionStorage.setItem('baraza_token_type', data.tokenType || 'Bearer')
      sessionStorage.setItem('baraza_user_email', data.email)
      sessionStorage.setItem('baraza_user_role', normalizedRole)
      sessionStorage.setItem('baraza_user_id', String(data.userId))

      setPassword('')

      if (normalizedRole === 'ROLE_STAFF') {
        navigate('/staff/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="brand-mark">B</span>
          <span>BARAZA</span>
        </div>

        <div className="auth-brand-content">
          <p className="auth-eyebrow">BANKING MADE SIMPLER</p>
          <h1>Banking that moves your future forward.</h1>
          <p>
            Access your accounts and manage your banking securely
            through Baraza Internet Banking.
          </p>
        </div>

        <p className="auth-brand-footer">BARAZA DIGITAL BANKING · KENYA</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <span className="brand-mark">B</span>
            <span>BARAZA</span>
          </div>

          <p className="auth-eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="auth-description">
            Enter your email address and password to access your internet banking.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={submitting}
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                disabled={submitting}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {message && (
              <p role="alert" className="form-message">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-register-link">
            Don't have an account? <Link to="/register">Register online</Link>
          </p>

          <div className="auth-security-note">
            <strong>Security notice</strong>
            <p>
              Never share your password or one-time verification codes.
              Baraza will never ask you to disclose these details.
            </p>
          </div>

          <p className="auth-demo-note">
            Secure authentication · Baraza customer service
          </p>
        </div>
      </section>
    </main>
  )
}
