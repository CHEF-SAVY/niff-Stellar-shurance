import { z } from 'zod'

export const QuoteFormSchema = z.object({
  contractAddress: z.string()
    .min(1, 'Contract address is required')
    .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
  
  coverageAmount: z.number()
    .min(100, 'Minimum coverage amount is 100 XLM')
    .max(1000000, 'Maximum coverage amount is 1,000,000 XLM')
    .positive('Coverage amount must be positive'),
  
  riskCategory: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Please select a risk category'
  }),
  
  contractType: z.enum(['DEFI_PROTOCOL', 'SMART_CONTRACT', 'LIQUIDITY_POOL', 'BRIDGE'], {
    message: 'Please select a contract type'
  }),
  
  duration: z.number()
    .min(7, 'Minimum duration is 7 days')
    .max(365, 'Maximum duration is 365 days')
    .positive('Duration must be positive'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  
  additionalCoverage: z.boolean(),
  
  customParameters: z.record(z.string(), z.any()).optional(),
})

export type QuoteFormData = z.infer<typeof QuoteFormSchema>

export const QuoteResponseSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  premium: z.number(),
  coverageAmount: z.number(),
  currency: z.string(),
  expiresAt: z.string(),
  riskScore: z.number(),
  terms: z.array(z.string()),
  paymentAddress: z.string(),
  createdAt: z.string(),
})

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>

export const QuoteErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
})

export type QuoteError = z.infer<typeof QuoteErrorSchema>
