
import { useCallback, useEffect, useState } from 'react'
import {
  approveApplication,
  getPendingApplications,
  rejectApplication,
  type CustomerApplication,
} from '../api/staffApi'
import './staff.css'

export default function StaffDashboardPage() {
  const [applications, setApplications] = useState<CustomerApplication[]>([])
  const [selectedApplication, setSelectedApplication] =
    useState<CustomerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const loadApplications = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const data = await getPendingApplications()
      setApplications(data)

      setSelectedApplication((current) => {
        if (!current) return data[0] ?? null

        return data.find(
          (application) =>
            application.applicationReference === current.applicationReference,
        ) ?? data[0] ?? null
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load customer applications.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  async function handleApprove() {
    if (!selectedApplication || processing) return

    const confirmed = window.confirm(
      `Approve the application for ${selectedApplication.firstName} ${selectedApplication.lastName}?`,
    )

    if (!confirmed) return

    setProcessing(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await approveApplication(
        selectedApplication.applicationReference,
      )

      setSuccessMessage(result.message || 'Application approved successfully.')
      setShowRejectForm(false)
      setRejectionReason('')
      await loadApplications(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to approve application.',
      )
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!selectedApplication || processing) return

    const reason = rejectionReason.trim()

    if (!reason) {
      setError('Please provide a reason for rejecting this application.')
      return
    }

    setProcessing(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await rejectApplication(
        selectedApplication.applicationReference,
        { reason },
      )

      setSuccessMessage(result.message || 'Application rejected successfully.')
      setShowRejectForm(false)
      setRejectionReason('')
      await loadApplications(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reject application.',
      )
    } finally {
      setProcessing(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('baraza_access_token')
    sessionStorage.removeItem('baraza_token_type')
    sessionStorage.removeItem('baraza_user_email')
    sessionStorage.removeItem('baraza_user_role')
    sessionStorage.removeItem('baraza_user_id')

    window.location.assign('/')
  }

  function formatDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString()
  }

  return (
    <main className="staff-page">
      <header className="staff-topbar">
        <div className="staff-brand">
          <span className="staff-brand-mark">B</span>
          <div>
            <strong>BARAZA</strong>
            <span>STAFF OPERATIONS</span>
          </div>
        </div>

        <div className="staff-user-area">
          <div className="staff-user-details">
            <strong>Staff workspace</strong>
            <span>{sessionStorage.getItem('baraza_user_email')}</span>
          </div>

          <button
            type="button"
            className="staff-logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="staff-content">
        <section className="staff-page-heading">
          <div>
            <p className="staff-eyebrow">OPERATIONS / CUSTOMER MANAGEMENT</p>
            <h1>Customer applications</h1>
            <p>
              Review new customer applications and manage onboarding decisions.
            </p>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={() => void loadApplications(true)}
            disabled={loading || refreshing || processing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh queue'}
          </button>
        </section>

        <section className="staff-summary-grid">
          <article className="staff-summary-card">
            <span>Pending applications</span>
            <strong>{applications.length}</strong>
            <small>Awaiting staff review</small>
          </article>

          <article className="staff-summary-card">
            <span>Selected application</span>
            <strong>
              {selectedApplication ? '1' : '0'}
            </strong>
            <small>Currently in review</small>
          </article>

          <article className="staff-summary-card">
            <span>Workspace</span>
            <strong>Active</strong>
            <small>Staff operations</small>
          </article>
        </section>

        {error && (
          <div className="staff-alert staff-alert-error" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="staff-alert staff-alert-success" role="status">
            {successMessage}
          </div>
        )}

        <section className="staff-workspace">
          <div className="staff-application-list">
            <div className="staff-section-heading">
              <div>
                <h2>Application queue</h2>
                <span>{applications.length} pending</span>
              </div>
            </div>

            {loading ? (
              <p className="staff-state-message">Loading applications...</p>
            ) : applications.length === 0 ? (
              <div className="staff-empty-state">
                <strong>No pending applications</strong>
                <p>New customer applications will appear here.</p>
              </div>
            ) : (
              <div className="staff-application-items">
                {applications.map((application) => (
                  <button
                    type="button"
                    key={application.applicationReference}
                    className={`staff-application-item ${
                      selectedApplication?.applicationReference ===
                      application.applicationReference
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedApplication(application)
                      setShowRejectForm(false)
                      setRejectionReason('')
                      setError('')
                      setSuccessMessage('')
                    }}
                  >
                    <span className="staff-applicant-avatar">
                      {application.firstName.charAt(0)}
                      {application.lastName.charAt(0)}
                    </span>

                    <span className="staff-applicant-summary">
                      <strong>
                        {application.firstName} {application.lastName}
                      </strong>
                      <span>{application.email}</span>
                      <small>
                        Ref: {application.applicationReference}
                      </small>
                    </span>

                    <span className="staff-pending-badge">Pending</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="staff-review-panel">
            {!selectedApplication ? (
              <div className="staff-empty-review">
                <h2>Application review</h2>
                <p>Select an application from the queue to review its details.</p>
              </div>
            ) : (
              <>
                <div className="staff-section-heading">
                  <div>
                    <p className="staff-eyebrow">APPLICATION REVIEW</p>
                    <h2>Applicant details</h2>
                  </div>
                  <span className="staff-pending-badge">Pending</span>
                </div>

                <div className="staff-reference">
                  <span>Application reference</span>
                  <strong>{selectedApplication.applicationReference}</strong>
                </div>

                <div className="staff-detail-grid">
                  <div>
                    <span>First name</span>
                    <strong>{selectedApplication.firstName}</strong>
                  </div>

                  <div>
                    <span>Last name</span>
                    <strong>{selectedApplication.lastName}</strong>
                  </div>

                  <div>
                    <span>Email address</span>
                    <strong>{selectedApplication.email}</strong>
                  </div>

                  <div>
                    <span>Application status</span>
                    <strong>{selectedApplication.status}</strong>
                  </div>

                  <div className="staff-detail-full">
                    <span>Submitted at</span>
                    <strong>
                      {formatDate(selectedApplication.submittedAt)}
                    </strong>
                  </div>
                </div>

                <div className="staff-review-notice">
                  <strong>Review decision</strong>
                  <p>
                    Approval creates a customer account in pending-activation
                    status. It does not mean the customer's account is already
                    activated.
                  </p>
                </div>

                {showRejectForm && (
                  <div className="staff-rejection-form">
                    <label htmlFor="rejectionReason">
                      Reason for rejection
                    </label>

                    <textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value.slice(0, 500))
                      }
                      placeholder="Explain why this application is being rejected..."
                      maxLength={500}
                      rows={4}
                      disabled={processing}
                    />

                    <div className="staff-character-count">
                      {rejectionReason.length}/500 characters
                    </div>

                    <div className="staff-action-buttons">
                      <button
                        type="button"
                        className="staff-cancel-button"
                        onClick={() => {
                          setShowRejectForm(false)
                          setRejectionReason('')
                        }}
                        disabled={processing}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="staff-reject-button"
                        onClick={() => void handleReject()}
                        disabled={processing || !rejectionReason.trim()}
                      >
                        {processing ? 'Processing...' : 'Confirm rejection'}
                      </button>
                    </div>
                  </div>
                )}

                {!showRejectForm && (
                  <div className="staff-action-buttons">
                    <button
                      type="button"
                      className="staff-reject-button"
                      onClick={() => setShowRejectForm(true)}
                      disabled={processing}
                    >
                      Reject application
                    </button>

                    <button
                      type="button"
                      className="staff-approve-button"
                      onClick={() => void handleApprove()}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Approve application'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <footer className="staff-footer">
          Baraza Digital Banking · Staff Operations
        </footer>
      </div>
    </main>
  )
}
