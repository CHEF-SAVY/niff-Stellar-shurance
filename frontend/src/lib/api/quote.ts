import { getConfig } from '@/config/env'
import { QuoteFormData, QuoteResponse, QuoteError as QuoteErrorType } from '@/lib/schemas/quote'

const { apiUrl: API_BASE_URL } = getConfig()

export class QuoteAPI {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: QuoteErrorType = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }))
      throw new QuoteError(errorData.code, errorData.message, errorData.details)
    }
    return response.json()
  }

  static async getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    return this.handleResponse<QuoteResponse>(response)
  }

  static async getQuoteById(quoteId: string): Promise<QuoteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}`)
    return this.handleResponse<QuoteResponse>(response)
  }

  static async validateQuote(quoteId: string): Promise<{ valid: boolean; expiresAt: string }> {
    const response = await fetch(`${API_BASE_URL}/api/quotes/${quoteId}/validate`)
    return this.handleResponse<{ valid: boolean; expiresAt: string }>(response)
  }
}

export class QuoteError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'QuoteError'
  }
}

export const QUOTE_ERROR_MESSAGES: Record<string, string> = {
  'INVALID_CONTRACT_ADDRESS': 'The provided contract address is not valid',
  'INSUFFICIENT_COVERAGE': 'Coverage amount is below minimum requirements',
  'EXCESSIVE_COVERAGE': 'Coverage amount exceeds maximum limits',
  'HIGH_RISK_PROFILE': 'Your risk profile is too high for coverage',
  'CONTRACT_NOT_SUPPORTED': 'This contract type is not currently supported',
  'RATE_LIMIT_EXCEEDED': 'Too many quote requests. Please try again later',
  'NETWORK_ERROR': 'Network connection failed. Please check your connection',
  'SERVER_ERROR': 'Server error occurred. Please try again later',
  'QUOTE_EXPIRED': 'This quote has expired. Please request a new one',
  'INVALID_RISK_CATEGORY': 'Invalid risk category selected',
  'INVALID_DURATION': 'Policy duration is not within allowed range',
  'VALIDATION_ERROR': 'Please check your form inputs and try again',
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again',
}

export function getQuoteErrorMessage(error: QuoteError): string {
  return QUOTE_ERROR_MESSAGES[error.code] || error.message || QUOTE_ERROR_MESSAGES.UNKNOWN_ERROR
}
