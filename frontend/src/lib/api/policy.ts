import { getConfig } from '@/config/env'
import { PolicyInitiationData, Transaction, Policy, PolicyError as PolicyErrorType } from '@/lib/schemas/policy'

const { apiUrl: API_BASE_URL, explorerBase: EXPLORER_BASE } = getConfig()

export class PolicyAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: PolicyErrorType = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }))
      throw new PolicyError(errorData.code, errorData.message, errorData.details)
    }
    return response.json()
  }

  static async initiatePolicy(data: PolicyInitiationData): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/api/policies/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return this.handleResponse<Transaction>(response)
  }

  static async submitTransaction(transactionXdr: string, signature: string): Promise<{ policyId: string; transactionHash: string }> {
    const response = await fetch(`${API_BASE_URL}/api/policies/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionXdr, signature }),
    })

    return this.handleResponse<{ policyId: string; transactionHash: string }>(response)
  }

  static async getPolicy(policyId: string): Promise<Policy> {
    const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}`)
    return this.handleResponse<Policy>(response)
  }

  static async pollPolicyStatus(policyId: string, maxAttempts: number = 20, interval: number = 3000): Promise<Policy> {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const policy = await this.getPolicy(policyId)
        
        if (policy.status !== 'PENDING') {
          return policy
        }
        
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      }
    }
    
    throw new PolicyError('TIMEOUT_ERROR', 'Policy confirmation timeout. Please check back later.')
  }
}

export class PolicyError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PolicyError'
  }
}

export const POLICY_ERROR_MESSAGES: Record<string, string> = {
  'INVALID_QUOTE': 'The provided quote is invalid or has expired',
  'QUOTE_EXPIRED': 'This quote has expired. Please request a new one',
  'INVALID_WALLET_ADDRESS': 'The provided wallet address is not valid',
  'INSUFFICIENT_BALANCE': 'Insufficient balance to cover the premium and fees',
  'TRANSACTION_FAILED': 'Transaction failed. Please try again',
  'NETWORK_ERROR': 'Network connection failed. Please check your connection',
  'SERVER_ERROR': 'Server error occurred. Please try again later',
  'SIGNATURE_INVALID': 'Invalid signature provided',
  'TIMEOUT_ERROR': 'Operation timed out. Please try again',
  'POLICY_ALREADY_EXISTS': 'A policy already exists for this quote',
  'TERMS_NOT_ACCEPTED': 'You must accept the terms and conditions',
  'VALIDATION_ERROR': 'Please check your inputs and try again',
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again',
}

export function getPolicyErrorMessage(error: PolicyError): string {
  return POLICY_ERROR_MESSAGES[error.code] || error.message || POLICY_ERROR_MESSAGES.UNKNOWN_ERROR
}

export function getExplorerUrl(transactionHash: string): string {
  return `${EXPLORER_BASE}/${transactionHash}`
}
