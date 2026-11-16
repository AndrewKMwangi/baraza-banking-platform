
export interface CustomerApplication {
  applicationReference: string
  firstName: string
  lastName: string
  email: string
  status: string
  submittedAt: string
}

export interface ApplicationReviewResponse {
  applicationReference: string
  status: string
  message: string
  reviewedAt: string
}

export interface RejectApplicationRequest {
  reason: string
}

const CUSTOMER_APPLICATIONS_API_URL = '/api/customer-applications'

function getAuthorizationHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('baraza_access_token')

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

async function handleApiError(response: Response): Promise<never> {
  const errorBody = await response.text()

  throw new Error(
    `Staff API request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
  )
}

export async function getPendingApplications(): Promise<CustomerApplication[]> {
  const response = await fetch(
    `${CUSTOMER_APPLICATIONS_API_URL}?status=PENDING`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthorizationHeaders(),
      },
    },
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json() as Promise<CustomerApplication[]>
}

export async function approveApplication(
  applicationReference: string,
): Promise<ApplicationReviewResponse> {
  const response = await fetch(
    `${CUSTOMER_APPLICATIONS_API_URL}/${encodeURIComponent(applicationReference)}/approve`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthorizationHeaders(),
      },
    },
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json() as Promise<ApplicationReviewResponse>
}

export async function rejectApplication(
  applicationReference: string,
  request: RejectApplicationRequest,
): Promise<ApplicationReviewResponse> {
  const response = await fetch(
    `${CUSTOMER_APPLICATIONS_API_URL}/${encodeURIComponent(applicationReference)}/reject`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getAuthorizationHeaders(),
      },
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json() as Promise<ApplicationReviewResponse>
}
