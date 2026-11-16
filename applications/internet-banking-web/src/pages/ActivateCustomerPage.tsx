import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

interface ActivationResponse {
  message?: string
}

export default function ActivateCustomerPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('The activation link is missing its token.')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/customer-activation/activate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json().catch(() => ({})) as ActivationResponse

      if (!response.ok) {
        throw new Error(data.message || 'Activation failed. The link may be invalid or expired.')
      }

      setMessage(data.message || 'Your account has been activated successfully.')
      setActivated(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>BARAZA</div>

        <h1 style={styles.heading}>Activate your account</h1>

        <p style={styles.description}>
          Set your password to complete your internet banking registration.
        </p>

        {!token && (
          <div style={styles.error}>
            This activation link is incomplete. Please use the full link provided to you.
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        {!activated && token && (
          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="password">
              Create password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              style={styles.input}
            />

            <label style={styles.label} htmlFor="confirmPassword">
              Confirm password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              style={styles.input}
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Activating...' : 'Activate account'}
            </button>
          </form>
        )}

        {activated && (
          <Link to="/" style={styles.link}>
            Continue to login
          </Link>
        )}

        {!activated && (
          <p style={styles.footer}>
            Already activated? <Link to="/" style={styles.link}>Sign in</Link>
          </p>
        )}
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f3f6fb',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '36px',
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(20, 40, 80, 0.09)',
  },
  brand: {
    color: '#174ea6',
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '2px',
    marginBottom: '28px',
  },
  heading: {
    color: '#172b4d',
    fontSize: '25px',
    margin: '0 0 10px',
  },
  description: {
    color: '#65748b',
    lineHeight: 1.6,
    marginBottom: '26px',
  },
  label: {
    display: 'block',
    color: '#344563',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '15px',
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '13px',
    border: 0,
    borderRadius: '7px',
    background: '#174ea6',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    marginBottom: '18px',
    borderRadius: '7px',
    background: '#fff0f0',
    color: '#a12626',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  success: {
    padding: '12px',
    marginBottom: '18px',
    borderRadius: '7px',
    background: '#eaf7ee',
    color: '#176b35',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: '24px',
    color: '#65748b',
    fontSize: '14px',
    textAlign: 'center',
  },
  link: {
    color: '#174ea6',
    fontWeight: 600,
    textDecoration: 'none',
  },
}