/**
 * Centralized error handling for NiffyInsur.
 *
 * - Maps backend/Stellar error codes → user-safe UI strings (i18n-ready keys).
 * - Carries optional correlation ID (requestId) for support escalation.
 * - Never surfaces private keys, seeds, or raw XDR in user-facing messages.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** All user-facing error strings. Keys are i18n-ready — swap values for translations. */
export const ERROR_MESSAGES: Record<string, string> = {
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network connection failed. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',

  // Auth
  UNAUTHORIZED: 'Your session has expired. Please reconnect your wallet.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  SIGNATURE_INVALID: 'Wallet signature was invalid. Please try again.',
  NONCE_EXPIRED: 'Authentication challenge expired. Please reconnect.',

  // Policy
  INVALID_QUOTE: 'The provided quote is invalid or has expired.',
  QUOTE_EXPIRED: 'This quote has expired. Please request a new one.',
  INVALID_WALLET_ADDRESS: 'The provided wallet address is not valid.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to cover the premium and fees.',
  POLICY_ALREADY_EXISTS: 'A policy already exists for this quote.',
  TERMS_NOT_ACCEPTED: 'You must accept the terms and conditions.',

  // Claims
  CLAIM_NOT_FOUND: 'Claim not found.',
  CLAIM_ALREADY_EXISTS: 'A claim has already been filed for this policy.',
  POLICY_NOT_FOUND: 'Policy not found.',
  POLICY_INACTIVE: 'This policy is no longer active.',
  CLAIM_AMOUNT_EXCEEDS_COVERAGE: 'Claim amount exceeds your coverage limit.',
  OPEN_CLAIM_EXISTS: 'An open claim already exists for this policy.',

  // Voting
  ALREADY_VOTED: 'You have already voted on this claim.',
  NOT_A_VOTER: 'You are not eligible to vote on this claim.',
  VOTING_CLOSED: 'Voting for this claim has closed.',

  // Stellar / Soroban
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected by the network.',
  INSUFFICIENT_FEE: 'Transaction fee is too low. Please increase the fee.',
  CONTRACT_ERROR: 'Smart contract returned an error. Please try again.',
  SOROBAN_RPC_ERROR: 'Blockchain RPC error. Please try again shortly.',
  LEDGER_CLOSED: 'The ledger closed before your transaction was included. Please resubmit.',

  // Quote
  INVALID_CONTRACT_ADDRESS: 'The provided contract address is not valid.',
  INSUFFICIENT_COVERAGE: 'Coverage amount is below the minimum requirement.',
  EXCESSIVE_COVERAGE: 'Coverage amount exceeds the maximum limit.',
  HIGH_RISK_PROFILE: 'Your risk profile is too high for coverage at this time.',
  CONTRACT_NOT_SUPPORTED: 'This contract type is not currently supported.',
  INVALID_RISK_CATEGORY: 'Invalid risk category selected.',
  INVALID_DURATION: 'Policy duration is outside the allowed range.',
};

/**
 * Resolve a user-safe message from any thrown value.
 * Falls back gracefully — never exposes stack traces or raw error internals.
 */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  if (error instanceof Error) {
    // Map well-known network errors
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/** Extract correlation ID from an error for support escalation. */
export function getCorrelationId(error: unknown): string | undefined {
  if (error instanceof AppError) return error.requestId;
  return undefined;
}
