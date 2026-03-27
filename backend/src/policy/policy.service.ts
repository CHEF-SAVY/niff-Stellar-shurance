import { Injectable } from '@nestjs/common';
import { SorobanService } from '../rpc/soroban.service';
import type { BuildTransactionDto } from './dto/build-transaction.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly soroban: SorobanService) {}

  async buildTransaction(dto: BuildTransactionDto) {
    return this.soroban.buildInitiatePolicyTransaction({
      holder: dto.holder,
      policyType: dto.policy_type,
      region: dto.region,
      ageBand: dto.age_band,
      coverageType: dto.coverage_type,
      safetyScore: dto.safety_score,
      baseAmount: BigInt(dto.base_amount),
      asset: dto.asset,
      beneficiary: dto.beneficiary,
    });
  }
}
