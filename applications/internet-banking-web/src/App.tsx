
import { useEffect, useState, type FormEvent } from 'react'
import {
  createTransfer,
  getAccounts,
  getTransactions,
  BarazaApiError,
  type BarazaAccount,
  type BarazaTransaction,
} from './api/barazaApi'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StaffDashboardPage from './pages/StaffDashboardPage'
import ActivateCustomerPage from './pages/ActivateCustomerPage'

type Transaction = {
  id: string
  name: string
  category: string
  date: string
  amount: number
  currency: string
  direction: 'in' | 'out'
  status: 'Completed' | 'Pending' | 'Failed'
}

const navigation = [
  { label: 'Overview', icon: 'â—‰' },
  { label: 'My accounts', icon: 'â–¤' },
  { label: 'Transfers', icon: 'â‡„' },
  { label: 'Transactions', icon: 'â†•' },
  { label: 'Beneficiaries', icon: 'â™™' },
]

const money = (amount: number, currency = 'KES') => {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('en-KE')}`
  }
}

function mapApiTransaction(transaction: BarazaTransaction): Transaction {
  const type = transaction.transactionType.toUpperCase()
  const apiStatus = transaction.status.toUpperCase()

  return {
    id: transaction.reference || String(transaction.id),
    name: `${transaction.transactionType} - Account ${transaction.accountId}`,
    category: transaction.transactionType,
    date: transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleString('en-KE')
      : 'Date unavailable',
    amount: Number(transaction.amount),
    currency: transaction.currency,
    direction: type === 'DEPOSIT' ? 'in' : 'out',
    status:
      apiStatus === 'COMPLETED'
        ? 'Completed'
        : apiStatus === 'FAILED'
          ? 'Failed'
          : 'Pending',
  }
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [showBalance, setShowBalance] = useState(true)
  const [showTransfer, setShowTransfer] = useState(false)

  const [recipient, setRecipient] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [transferSubmitting, setTransferSubmitting] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferMessage, setTransferMessage] = useState('')

  const [transactions] = useState<Transaction[]>([])
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('All')

  const [apiAccounts, setApiAccounts] = useState<BarazaAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState('')

  const [apiTransactions, setApiTransactions] = useState<BarazaTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionsError, setTransactionsError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      try {
        setAccountsLoading(true)
        setAccountsError('')
        const data = await getAccounts()

        if (!cancelled) {
          setApiAccounts(data)
        }
      } catch (error) {
        if (!cancelled) {
          setAccountsError(
            error instanceof Error
              ? error.message
              : 'Unable to load accounts from the backend.',
          )
        }
      } finally {
        if (!cancelled) {
          setAccountsLoading(false)
        }
      }
    }

    async function loadTransactions() {
      try {
        setTransactionsLoading(true)
        setTransactionsError('')
        const data = await getTransactions()

        if (!cancelled) {
          setApiTransactions(data)
        }
      } catch (error) {
        if (!cancelled) {
          setTransactionsError(
            error instanceof Error
              ? error.message
              : 'Unable to load transactions from the backend.',
          )
        }
      } finally {
        if (!cancelled) {
          setTransactionsLoading(false)
        }
      }
    }

    void loadAccounts()
    void loadTransactions()

    return () => {
      cancelled = true
    }
  }, [])

  const displayedAccounts = apiAccounts

  const totalKesBalance = displayedAccounts
    .filter((account) => account.currency === 'KES')
    .reduce((total, account) => total + Number(account.balance), 0)

  const displayedTransactions: Transaction[] = [
    ...transactions.filter(
      (transaction) => transaction.category === 'Demo transfer',
    ),
    ...apiTransactions.map(mapApiTransaction),
  ]
  const filteredTransactions = displayedTransactions.filter((transaction) => {
    const search = transactionSearch.trim().toLowerCase()

    const matchesSearch =
      search === '' ||
      transaction.name.toLowerCase().includes(search) ||
      transaction.category.toLowerCase().includes(search) ||
      transaction.id.toLowerCase().includes(search)

    const matchesStatus =
      transactionStatusFilter === 'All' ||
      transaction.status === transactionStatusFilter

    return matchesSearch && matchesStatus
  })

  const visibleTransactions =
    activePage === 'Overview'
      ? filteredTransactions.slice(0, 5)
      : filteredTransactions

  const completedCount = displayedTransactions.filter(
    (transaction) => transaction.status === 'Completed',
  ).length

  function navigateTo(page: string) {
    setActivePage(page)
    setShowTransfer(page === 'Transfers')
    setTransferMessage('')
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (transferSubmitting) {
      return
    }

    const amount = Number(transferAmount)
    const sourceId = Number(sourceAccountId)

    if (!recipient.trim() || !accountNumber.trim()) {
      setTransferMessage('Enter the recipient name and destination account number.')
      return
    }

    if (!sourceAccountId || !Number.isInteger(sourceId)) {
      setTransferMessage('Select a valid source account.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setTransferMessage('Enter a valid transfer amount greater than zero.')
      return
    }

    const sourceAccount = apiAccounts.find(
      (account) => account.id === sourceId,
    )

    const destinationAccount = apiAccounts.find(
      (account) =>
        account.accountNumber.trim().toUpperCase() ===
        accountNumber.trim().toUpperCase(),
    )

    if (!sourceAccount || !destinationAccount) {
      setTransferMessage('Source or destination account could not be found.')
      return
    }

    if (sourceAccount.id === destinationAccount.id) {
      setTransferMessage('Source and destination accounts must be different.')
      return
    }

    if (
      sourceAccount.status.toUpperCase() !== 'ACTIVE' ||
      destinationAccount.status.toUpperCase() !== 'ACTIVE'
    ) {
      setTransferMessage('Both accounts must be active to make a transfer.')
      return
    }

    if (sourceAccount.currency !== destinationAccount.currency) {
      setTransferMessage('Source and destination account currencies do not match.')
      return
    }

    if (amount > Number(sourceAccount.balance)) {
      setTransferMessage('Insufficient funds in the selected source account.')
      return
    }

    setTransferSubmitting(true)
    setTransferMessage('Submitting transfer...')

    try {
      const reference = crypto.randomUUID()

      const result = await createTransfer({
        accountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
        transactionType: 'TRANSFER',
        amount,
        currency: sourceAccount.currency,
        reference,
      })

      setTransferMessage(
        `Transfer ${result.status.toLowerCase()}. Reference: ${result.reference}`,
      )

      setRecipient('')
      setSourceAccountId('')
      setAccountNumber('')
      setTransferAmount('')

      try {
        const [updatedAccounts, updatedTransactions] = await Promise.all([
          getAccounts(),
          getTransactions(),
        ])

        setApiAccounts(updatedAccounts)
        setApiTransactions(updatedTransactions)
        setTransferMessage(
          `Transfer ${result.status.toLowerCase()} successfully. Reference: ${result.reference}. Balances and transaction history refreshed.`,
        )
      } catch {
        setTransferMessage(
          `Transfer was accepted by the backend. Reference: ${result.reference}. However, refreshing balances and transaction history failed. Please reload the page to verify the latest balances.`,
        )
      }
    } catch (error) {
      if (error instanceof BarazaApiError && error.status === 409) {
        setTransferMessage(
          'Transfer rejected: this reference conflicts with an existing operation. No new transfer was created.',
        )
      } else {
        setTransferMessage(
          error instanceof Error
            ? error.message
            : 'Transfer failed. Please try again.',
        )
      }
    } finally {
      setTransferSubmitting(false)
    }
  }

  return (
    <div className="banking-app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('Overview')
          }}
        >
          <span className="brand-mark">B</span>
          <span>
            baraza<span className="brand-light">.</span>
            <small>INTERNET BANKING</small>
          </span>
        </a>

        <div className="profile-card">
          <div className="avatar">AM</div>
          <div>
            <strong>Andrew Mwangi</strong>
            <span>Personal banking</span>
          </div>
          <span className="profile-dot">â—</span>
        </div>

        <p className="nav-heading">BANKING MENU</p>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item${activePage === item.label ? ' active' : ''}`}
              onClick={() => navigateTo(item.label)}
              aria-current={activePage === item.label ? 'page' : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Transactions' && (
                <span className="nav-count">
                  {displayedTransactions.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">?</span>
            <strong>Need assistance?</strong>
            <p>We're here to help with your banking questions.</p>
            <button
              onClick={() =>
                window.alert(
                  "Contact support through your bank's official support channel.",
                )
              }
            >
              Contact support â†’
            </button>
          </div>
          <button
            className="nav-item sign-out"
            onClick={() =>
              window.alert('Sign-out is not connected in this demo.')
            }
          >
            <span className="nav-icon">â†ª</span>
            Sign out
          </button>
          <p className="version-label">BARAZA DIGITAL Â· DEMO</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Banking <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <span className="secure-label">
              <span>â—</span> Secure session Â· Demo
            </span>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() =>
                window.alert('Notifications are not connected in this demo.')
              }
            >
              â™§<i />
            </button>
            <div className="top-avatar">AM</div>
          </div>
        </header>

        <div className="page-content">
          <div className="demo-banner">
            <span className="demo-banner-icon">!</span>
            <span>
              <strong>Demonstration environment.</strong> Account and
              transaction information is loaded from your configured backend
              when available. Demo transfers are local only and never move
              real money.
            </span>
          </div>

          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
              <h1>
                {activePage === 'Overview'
                  ? 'Welcome back, Andrew'
                  : activePage}
              </h1>
              <p className="welcome-subtitle">
                Here's an overview of your Baraza banking activity.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setActivePage('Transfers')
                setShowTransfer(true)
                setTransferMessage('')
              }}
            >
              <span>+</span> New transfer
            </button>
          </section>

          {activePage === 'Overview' && (
            <section className="summary-grid" aria-label="Account summary">
              <div className="balance-card">
                <div className="balance-card-top">
                  <span>Total available balance (KES)</span>
                  <span className="balance-symbol">â—ˆ</span>
                </div>
                <div className="balance-amount">
                  <span>
                    {showBalance
                      ? accountsLoading
                        ? 'Loading...'
                        : accountsError
                          ? 'Unavailable'
                          : money(totalKesBalance)
                      : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
                  </span>
                  <button
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                    onClick={() => setShowBalance((current) => !current)}
                  >
                    {showBalance ? 'â—‰' : 'â—Ž'}
                  </button>
                </div>
                <p className="balance-note">
                  {accountsError
                    ? 'Backend account data could not be loaded.'
                    : accountsLoading
                      ? 'Retrieving account balances'
                      : `${displayedAccounts.length} account(s) Â· KES balances`}
                </p>
                <div className="balance-footer">
                  <span>BARAZA ACCOUNTS</span>
                  <span>LIVE API DATA</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>Accounts</span>
                  <span className="metric-icon green">â–¤</span>
                </div>
                <strong>
                  {accountsLoading
                    ? '...'
                    : accountsError
                      ? 'â€”'
                      : displayedAccounts.length}
                </strong>
                <p>
                  <span className="trend-neutral">
                    {accountsError ? 'API unavailable' : 'â— Account overview'}
                  </span>
                  <span> Â· Configured backend</span>
                </p>
                <div className="mini-bars">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <i key={bar} />
                  ))}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>Completed transactions</span>
                  <span className="metric-icon orange">â†•</span>
                </div>
                <strong>
                  {transactionsLoading
                    ? '...'
                    : transactionsError
                      ? 'â€”'
                      : completedCount}
                </strong>
                <p>
                  <span className="trend-neutral">
                    {transactionsError
                      ? 'API unavailable'
                      : 'â— Transaction overview'}
                  </span>
                  <span> Â· Available records</span>
                </p>
                <div className="mini-bars orange-bars">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <i key={bar} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {(activePage === 'Overview' || activePage === 'My accounts') && (
            <section className="accounts-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR MONEY</p>
                  <h2>My accounts</h2>
                </div>
                {activePage === 'Overview' && (
                  <button
                    className="text-button"
                    onClick={() => navigateTo('My accounts')}
                  >
                    View all â†’
                  </button>
                )}
              </div>

              {accountsLoading && (
                <p>Loading accounts from the backend...</p>
              )}
              {accountsError && (
                <p role="alert">
                  Unable to load accounts: {accountsError}
                </p>
              )}
              {!accountsLoading &&
                !accountsError &&
                displayedAccounts.length === 0 && (
                  <p>No accounts were returned by the backend.</p>
                )}

              <div className="accounts-grid">
                {(activePage === 'Overview'
                  ? displayedAccounts.slice(0, 2)
                  : displayedAccounts
                ).map((account) => (
                  <article className="account-card" key={account.id}>
                    <div className="account-top">
                      <span
                        className={`account-icon ${
                          account.accountType.toLowerCase().includes('saving')
                            ? 'savings'
                            : 'deposit'
                        }`}
                      >
                        {account.accountType.toLowerCase().includes('saving')
                          ? 'â—ˆ'
                          : 'â–¤'}
                      </span>
                      <span className="status-pill">{account.status}</span>
                    </div>
                    <p className="account-type">{account.accountType}</p>
                    <h3>{account.accountType} account</h3>
                    <p className="account-number">{account.accountNumber}</p>
                    <div className="account-bottom">
                      <span>Available balance</span>
                      <strong>
                        {showBalance
                          ? money(Number(account.balance), account.currency)
                          : 'â€¢â€¢â€¢â€¢â€¢â€¢'}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(activePage === 'Overview' || activePage === 'Transactions') && (
            <section className="transactions-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR ACTIVITY</p>
                  <h2>
                    {activePage === 'Overview'
                      ? 'Recent transactions'
                      : 'All transactions'}
                  </h2>
                </div>
                {activePage === 'Overview' && (
                  <button
                    className="text-button"
                    onClick={() => navigateTo('Transactions')}
                  >
                    View all â†’
                  </button>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <input
                  aria-label="Search transactions"
                  placeholder="Search by name, type or reference..."
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  style={{
                    flex: '1 1 240px',
                    minHeight: 40,
                    padding: '0 12px',
                    border: '1px solid #dce4ec',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#20344e',
                    fontSize: 11,
                  }}
                />
                <select
                  aria-label="Filter transactions by status"
                  value={transactionStatusFilter}
                  onChange={(event) =>
                    setTransactionStatusFilter(event.target.value)
                  }
                  style={{
                    minHeight: 40,
                    padding: '0 12px',
                    border: '1px solid #dce4ec',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#20344e',
                    fontSize: 11,
                  }}
                >
                  <option value="All">All statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {transactionsLoading && (
                <p>Loading transactions from the backend...</p>
              )}
              {transactionsError && (
                <p role="alert">
                  Backend transactions could not be loaded: {transactionsError}
                </p>
              )}

              <div className="transaction-table-wrap">
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th>REFERENCE</th>
                      <th>DATE</th>
                      <th>STATUS</th>
                      <th className="amount-column">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="transaction-name">
                            <span
                              className={`transaction-icon ${transaction.direction}`}
                            >
                              {transaction.direction === 'in' ? 'â†™' : 'â†—'}
                            </span>
                            <span>
                              <strong>{transaction.name}</strong>
                              <small>{transaction.category}</small>
                            </span>
                          </div>
                        </td>
                        <td className="reference">{transaction.id}</td>
                        <td className="date-cell">{transaction.date}</td>
                        <td>
                          <span
                            className={`transaction-status ${transaction.status.toLowerCase()}`}
                          >
                            <i />
                            {transaction.status}
                          </span>
                        </td>
                        <td
                          className={`amount-cell ${transaction.direction}`}
                        >
                          {transaction.direction === 'in' ? '+' : 'âˆ’'}
                          {money(transaction.amount, transaction.currency)}
                        </td>
                      </tr>
                    ))}
                    {visibleTransactions.length === 0 && !transactionsLoading && !transactionsError && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: 24, textAlign: 'center' }}
                        >
                          {displayedTransactions.length === 0 ? 'No transactions are available yet.' : 'No transactions match your search and status filter.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="form-note">
                {activePage === 'Overview'
                  ? `Showing ${visibleTransactions.length} recent matching transaction(s).`
                  : `Showing ${visibleTransactions.length} matching transaction(s).`}
                {' '}Each amount is displayed in its transaction currency.
              </p>
            </section>
          )}

          {(activePage === 'Transfers' || showTransfer) && (
            <section className="transfer-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">MOVE MONEY</p>
                  <h2>New transfer</h2>
                </div>
                <button
                  className="close-button"
                  aria-label="Close transfer form"
                  onClick={() => {
                    setShowTransfer(false)
                    setTransferMessage('')
                    setActivePage('Overview')
                  }}
                >
                  Ã—
                </button>
              </div>

              <p className="form-note">
                Transfers are submitted to the Baraza backend. The backend validates
                the accounts and processes the transfer before balances are refreshed.
              </p>

              <form className="transfer-form" onSubmit={handleTransferSubmit}>
                <label>
                  Source account
                  <select
                    value={sourceAccountId}
                    onChange={(event) => setSourceAccountId(event.target.value)}
                    required
                    disabled={accountsLoading || transferSubmitting}
                  >
                    <option value="">Select source account</option>
                    {apiAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - {account.accountType} - {money(Number(account.balance), account.currency)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Recipient name
                  <input
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="Enter recipient name"
                    required
                  />
                </label>
                <label>
                  Destination account number
                  <input
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="Enter account number"
                    required
                  />
                </label>
                <label>
                  Amount (KES)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </label>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={transferSubmitting || accountsLoading}
                >
                  {transferSubmitting ? 'Processing transfer...' : 'Submit transfer ?'}
                </button>
              </form>

              {transferMessage && (
                <p className="transfer-message" role="status">
                  {transferMessage}
                </p>
              )}
            </section>
          )}

          {activePage === 'Beneficiaries' && (
            <section className="accounts-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PAYMENT CONTACTS</p>
                  <h2>Beneficiaries</h2>
                </div>
              </div>
              <p>
                Beneficiary management is not connected yet. No beneficiaries
                have been created by this demo.
              </p>
            </section>
          )}

          <footer className="page-footer">
            <span>
              Â© 2026 Baraza Digital Banking Â· Demonstration interface
            </span>
            <span>
              <i /> Backend connectivity depends on local services
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}
function StaffRoute() {
  const token = sessionStorage.getItem('baraza_access_token')
  const role = sessionStorage.getItem('baraza_user_role')

  if (!token || role !== 'ROLE_STAFF') {
    return <Navigate to="/" replace />
  }

  return <StaffDashboardPage />
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<App />} />
      <Route path="/staff/dashboard" element={<StaffRoute />} />
	  <Route path="/activate" element={<ActivateCustomerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
