
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './auth.css'

interface CustomerApplicationResponse {
  applicationReference: string
  firstName: string
  lastName: string
  email: string
  status: string
  submittedAt: string
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  })

  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [application, setApplication] =
    useState<CustomerApplicationResponse | null>(null)

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    setMessage('')
    setApplication(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/customer-applications', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nationalIdOrPassport: form.nationalId.trim(),
          dateOfBirth: form.dateOfBirth,
          email: form.email.trim(),
          phoneNumber: form.phone.trim(),
          residentialAddress: form.address.trim(),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()

        if (response.status === 400) {
          throw new Error(
            'Some application details are invalid. Please review the information and try again.',
          )
        }

        if (response.status === 409) {
          throw new Error(
            'An application may already exist for these details.',
          )
        }

        throw new Error(
          `Application submission failed (${response.status}). ${errorBody}`,
        )
      }

      const result: CustomerApplicationResponse = await response.json()

      setApplication(result)
      setMessage('Your application was submitted successfully.')

      setForm({
        firstName: '',
        lastName: '',
        nationalId: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
      })
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit your application. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="brand-mark">B</span>
          <span>BARAZA</span>
        </div>

        <div className="auth-brand-content">
          <p className="auth-eyebrow">YOUR BANKING JOURNEY STARTS HERE</p>
          <h1>Open the door to smarter banking.</h1>
          <p>
            Start your digital banking journey with Baraza.
            Complete your application and our banking team will
            guide you through the approval process.
          </p>
        </div>

        <p className="auth-brand-footer">BARAZA DIGITAL BANKING · KENYA</p>
      </section>

      <section className="auth-form-panel register-form-panel">
        <div className="auth-form-container register-form-container">
          <div className="mobile-brand">
            <span className="brand-mark">B</span>
            <span>BARAZA</span>
          </div>

          <p className="auth-eyebrow">NEW CUSTOMER</p>
          <h2>Create your application</h2>
          <p className="auth-description">
            Provide your details to begin the customer onboarding process.
          </p>

          {application ? (
            <div className="register-message" role="status">
              <h3>Application received</h3>
              <p>{message}</p>
              <p>
                Application reference: <strong>{application.applicationReference}</strong>
              </p>
              <p>
                Application status: <strong>{application.status}</strong>
              </p>
              <p>
                Keep your reference for future enquiries. Your application
                must be reviewed before banking access is granted.
              </p>
              <Link to="/">Return to sign in</Link>
            </div>
          ) : (
            <form className="auth-form register-form" onSubmit={handleSubmit}>
              <div className="register-grid">
                <div>
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    value={form.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    maxLength={100}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    value={form.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                    maxLength={100}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="nationalId">National ID / Passport</label>
                  <input
                    id="nationalId"
                    value={form.nationalId}
                    onChange={(event) => updateField('nationalId', event.target.value)}
                    placeholder="Identification number"
                    maxLength={100}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth">Date of birth</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateField('dateOfBirth', event.target.value)}
                    autoComplete="bday"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={255}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="tel"
                    maxLength={30}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="register-full-width">
                  <label htmlFor="address">Residential address</label>
                  <input
                    id="address"
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Town, estate and street"
                    autoComplete="street-address"
                    maxLength={500}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <label className="register-checkbox">
                <input type="checkbox" required disabled={submitting} />
                <span>
                  I confirm that the information provided is accurate and
                  agree to have my application reviewed by Baraza.
                </span>
              </label>

              <label className="register-checkbox">
                <input type="checkbox" required disabled={submitting} />
                <span>
                  I acknowledge that account access is subject to identity
                  verification and bank approval.
                </span>
              </label>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting application...' : 'Submit registration application'}
              </button>
            </form>
          )}

          {message && !application && (
            <p className="register-message" role="alert">
              {message}
            </p>
          )}

          {!application && (
            <p className="auth-register-link">
              Already registered? <Link to="/">Sign in</Link>
            </p>
          )}

          <div className="auth-security-note">
            <strong>What happens next?</strong>
            <p>
              Your application will be reviewed by authorized bank staff.
              You will only receive banking access after the required
              verification and approval process is completed.
            </p>
          </div>

          <p className="auth-demo-note">
            Customer application · Backend integrated
          </p>
        </div>
      </section>
    </main>
  )
}
