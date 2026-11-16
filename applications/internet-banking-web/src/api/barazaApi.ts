
export interface BarazaAccount {
  id: number;
  customerId: number;
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
  status: string;
}

export interface BarazaTransaction {
  id: number;
  accountId: number;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
}

const ACCOUNT_API_URL =
  import.meta.env.VITE_ACCOUNT_API_URL ?? "/api/accounts";

const TRANSACTION_API_URL =
  import.meta.env.VITE_TRANSACTION_API_URL ?? "/api/transactions";

const TRANSFER_API_URL = "/api/transfers";

function getAuthorizationHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("baraza_access_token");

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...getAuthorizationHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getAccounts(): Promise<BarazaAccount[]> {
  return getJson<BarazaAccount[]>(ACCOUNT_API_URL);
}

export function getTransactions(): Promise<BarazaTransaction[]> {
  return getJson<BarazaTransaction[]>(TRANSACTION_API_URL);
}

export interface CreateTransferRequest {
  accountId: number;
  destinationAccountId: number;
  transactionType: "TRANSFER";
  amount: number;
  currency: string;
  reference: string;
}

export interface BarazaTransferResponse {
  id: number;
  accountId: number;
  destinationAccountId: number;
  transactionType: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
}

export class BarazaApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BarazaApiError";
    this.status = status;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new BarazaApiError(
      `Transfer request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function createTransfer(
  request: CreateTransferRequest,
): Promise<BarazaTransferResponse> {
  return postJson<BarazaTransferResponse>(
    TRANSFER_API_URL,
    request,
  );
}
