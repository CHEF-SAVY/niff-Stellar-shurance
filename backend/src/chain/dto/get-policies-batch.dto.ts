import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { POLICY_BATCH_GET_MAX } from '../chain.constants';

export class PolicyLookupKeyDto {
  @ApiProperty({ description: 'Stellar account address of the policy holder' })
  @IsString()
  holder!: string;

  @ApiProperty({ minimum: 1, description: 'On-chain policy_id' })
  @IsInt()
  @Min(1)
  policy_id!: number;
}

export class GetPoliciesBatchDto {
  @ApiProperty({
    type: [PolicyLookupKeyDto],
    maxItems: POLICY_BATCH_GET_MAX,
    description: `Up to ${POLICY_BATCH_GET_MAX} (holder, policy_id) pairs; order is preserved in the response.`,
  })
  @IsArray()
  @ArrayMaxSize(POLICY_BATCH_GET_MAX, {
    message: `keys must contain at most ${POLICY_BATCH_GET_MAX} entries (on-chain POLICY_BATCH_GET_MAX)`,
  })
  @ValidateNested({ each: true })
  @Type(() => PolicyLookupKeyDto)
  keys!: PolicyLookupKeyDto[];

  @ApiPropertyOptional({
    description:
      'Account used as the Soroban transaction source for simulation (must exist on-chain). Defaults to keys[0].holder when keys is non-empty.',
  })
  @IsOptional()
  @IsString()
  source_account?: string;
}
