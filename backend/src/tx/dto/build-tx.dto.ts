/**
 * DTO for POST /tx/build
 *
 * Assembles an unsigned invokeHostFunction transaction with simulation-derived
 * footprints and fee estimates. The caller must sign and submit via POST /tx/submit.
 *
 * SECURITY: No seed phrases or private keys are accepted here.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export enum PolicyTypeEnum {
  Auto = 'Auto',
  Health = 'Health',
  Property = 'Property',
}

export enum RegionTierEnum {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum ContractFunctionEnum {
  InitiatePolicy = 'initiate_policy',
}

@ValidatorConstraint({ name: 'posIntString', async: false })
class PositiveIntStringConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return /^\d+$/.test(value) && BigInt(value) > BigInt(0);
  }
  defaultMessage() {
    return 'coverage must be a positive integer string (stroops)';
  }
}

export class BuildTxDto {
  @ApiProperty({
    description: 'Stellar public key of the transaction source / policyholder.',
    example: 'GDVOEGATQV4FGUJKDEBEYT5NAPWJ55MEMJVLC5TU7Y74WD73PPAS4TYW',
  })
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'source_account must be a valid Stellar public key (G...)',
  })
  source_account!: string;

  @ApiProperty({
    enum: ContractFunctionEnum,
    description: 'Contract function to invoke.',
  })
  @IsEnum(ContractFunctionEnum)
  function!: ContractFunctionEnum;

  @ApiProperty({ enum: PolicyTypeEnum })
  @IsEnum(PolicyTypeEnum)
  policy_type!: PolicyTypeEnum;

  @ApiProperty({ enum: RegionTierEnum })
  @IsEnum(RegionTierEnum)
  region!: RegionTierEnum;

  @ApiProperty({
    description: 'Max payout in stroops as an integer string. "1000000000" = 100 XLM.',
    example: '1000000000',
  })
  @IsString()
  @Validate(PositiveIntStringConstraint)
  coverage!: string;

  @ApiProperty({ minimum: 1, maximum: 120 })
  @IsInt()
  @Min(1)
  @Max(120)
  age!: number;

  @ApiProperty({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  risk_score!: number;

  @ApiPropertyOptional({
    description: 'SEP-41 asset contract address. Defaults to DEFAULT_TOKEN_CONTRACT_ID.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^C[A-Z2-7]{55}$/, {
    message: 'asset must be a valid Stellar contract address (C...)',
  })
  asset?: string;

  @ApiPropertyOptional({ description: 'Policy start ledger. Defaults to current ledger.' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  start_ledger?: number;

  @ApiPropertyOptional({
    description: 'Duration in ledgers (~5 s/ledger). Defaults to ~1 year (1_051_200).',
    maximum: 2_102_400,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2_102_400)
  duration_ledgers?: number;

  @ApiPropertyOptional({
    description:
      'If true, returns simulation resources and auth requirements without building the full envelope.',
    default: false,
  })
  @IsOptional()
  simulate?: boolean;
}
