/**
 * Policy bind DTOs (Zod).
 *
 * Schemas align with the contract argument ordering for initiate_policy:
 *   holder, policy_type, region, age_band, coverage_type, safety_score,
 *   base_amount, asset (optional), beneficiary (optional).
 */

import { z } from 'zod';

const PolicyTypeSchema = z.enum(['Auto', 'Health', 'Property']);

const RegionTierSchema = z.enum(['Low', 'Medium', 'High']);

const AgeBandSchema = z.enum(['Young', 'Adult', 'Senior']);

const CoverageTypeSchema = z.enum(['Basic', 'Standard', 'Premium']);

export const BuildTransactionDtoSchema = z.object({
  holder: z
    .string()
    .regex(
      /^G[A-Z2-7]{55}$/,
      'holder must be a valid Stellar public key (G...)',
    ),

  policy_type: PolicyTypeSchema,
  region: RegionTierSchema,
  age_band: AgeBandSchema,
  coverage_type: CoverageTypeSchema,

  safety_score: z
    .number()
    .int('safety_score must be an integer')
    .min(0, 'safety_score must be between 0 and 100')
    .max(100, 'safety_score must be between 0 and 100'),

  base_amount: z
    .string()
    .regex(/^\d+$/, 'base_amount must be a positive integer string (stroops)')
    .refine((v) => BigInt(v) > BigInt(0), {
      message: 'base_amount must be greater than 0',
    }),

  asset: z
    .string()
    .regex(
      /^C[A-Z2-7]{55}$/,
      'asset must be a valid Stellar contract address (C...)',
    )
    .optional(),

  beneficiary: z
    .string()
    .regex(
      /^G[A-Z2-7]{55}$/,
      'beneficiary must be a valid Stellar public key (G...)',
    )
    .optional(),
});

export type BuildTransactionDto = z.infer<typeof BuildTransactionDtoSchema>;
