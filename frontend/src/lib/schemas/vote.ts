import { z } from 'zod'

export const ClaimStatusSchema = z.enum([
  'Processing',
  'Pending',
  'Approved',
  'Paid',
  'Rejected',
])
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>

export const VoteOptionSchema = z.enum(['Approve', 'Reject'])
export type VoteOption = z.infer<typeof VoteOptionSchema>

export const ClaimSchema = z.object({
  claim_id: z.string(),
  policy_id: z.string(),
  claimant: z.string(),
  amount: z.string(),
  details: z.string(),
  image_urls: z.array(z.string()),
  status: ClaimStatusSchema,
  voting_deadline_ledger: z.number(),
  approve_votes: z.number(),
  reject_votes: z.number(),
  filed_at: z.number(),
  total_voters: z.number(),
})
export type Claim = z.infer<typeof ClaimSchema>

export const VoteRequestSchema = z.object({
  claimId: z.string().min(1),
  vote: VoteOptionSchema,
  walletAddress: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address'),
})
export type VoteRequest = z.infer<typeof VoteRequestSchema>

export const VoteResponseSchema = z.object({
  transactionHash: z.string(),
  status: ClaimStatusSchema,
  approve_votes: z.number(),
  reject_votes: z.number(),
})
export type VoteResponse = z.infer<typeof VoteResponseSchema>

export const EligibilitySchema = z.object({
  eligible: z.boolean(),
  reason: z.string().optional(),
  priorVote: VoteOptionSchema.nullable(),
})
export type Eligibility = z.infer<typeof EligibilitySchema>

// VOTE_WINDOW_LEDGERS from on-chain types.rs (re-exported constant)
// 1 ledger ≈ 5 s → 7 days ≈ 120_960 ledgers
export const VOTE_WINDOW_LEDGERS = 120_960
export const SECS_PER_LEDGER = 5

export function ledgersToMs(ledgers: number): number {
  return ledgers * SECS_PER_LEDGER * 1000
}

export function deadlineMs(filedAt: number, currentLedger: number): number {
  const remaining = filedAt + VOTE_WINDOW_LEDGERS - currentLedger
  return Math.max(0, remaining) * SECS_PER_LEDGER * 1000
}

export function isVoteOpen(filedAt: number, currentLedger: number): boolean {
  return currentLedger < filedAt + VOTE_WINDOW_LEDGERS
}

export function isTerminal(status: ClaimStatus): boolean {
  return status === 'Approved' || status === 'Paid' || status === 'Rejected'
}
