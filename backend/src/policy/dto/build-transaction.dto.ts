import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  AgeBandEnum,
  CoverageTypeEnum,
  PolicyTypeEnum,
  RegionTierEnum,
} from '../../quote/dto/generate-premium.dto';

@ValidatorConstraint({ name: 'posIntString', async: false })
class PositiveIntStringConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return /^\d+$/.test(value) && BigInt(value) > BigInt(0);
  }
  defaultMessage() {
    return 'base_amount must be a positive integer string (stroops)';
  }
}

export class BuildTransactionDto {
  @ApiProperty({
    description: 'Stellar public key of the policyholder.',
    example: 'GDVOEGATQV4FGUJKDEBEYT5NAPWJ55MEMJVLC5TU7Y74WD73PPAS4TYW',
  })
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'holder must be a valid Stellar public key (G...)',
  })
  holder!: string;

  @ApiProperty({ enum: PolicyTypeEnum })
  @IsEnum(PolicyTypeEnum)
  policy_type!: PolicyTypeEnum;

  @ApiProperty({ enum: RegionTierEnum })
  @IsEnum(RegionTierEnum)
  region!: RegionTierEnum;

  @ApiProperty({ enum: AgeBandEnum })
  @IsEnum(AgeBandEnum)
  age_band!: AgeBandEnum;

  @ApiProperty({ enum: CoverageTypeEnum })
  @IsEnum(CoverageTypeEnum)
  coverage_type!: CoverageTypeEnum;

  @ApiProperty({
    description: 'Safety score 0–100 (matches on-chain initiate_policy).',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  safety_score!: number;

  @ApiProperty({
    description:
      'Coverage / max payout in stroops as an integer string. E.g. "1000000000".',
    example: '1000000000',
  })
  @IsString()
  @Validate(PositiveIntStringConstraint)
  base_amount!: string;

  @ApiPropertyOptional({
    description: 'Optional Stellar asset contract address to use for the policy.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^C[A-Z2-7]{55}$/, {
    message: 'asset must be a valid Stellar contract address (C...)',
  })
  asset?: string;

  @ApiPropertyOptional({
    description:
      'Optional payout beneficiary (G...). If omitted, approved claims pay the holder. ' +
      'Verify this address carefully — phishing sites may try to redirect payouts.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'beneficiary must be a valid Stellar public key (G...)',
  })
  beneficiary?: string;
}
