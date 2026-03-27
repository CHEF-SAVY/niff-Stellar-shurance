/**
 * Policy transaction builder tests.
 *
 * These tests exercise the Nest service wrapper and verify DTO -> Soroban
 * argument mapping without making network calls.
 */

import type { BuildTransactionResult } from '../rpc/soroban.service';
import {
  AgeBandEnum,
  CoverageTypeEnum,
  PolicyTypeEnum,
  RegionTierEnum,
} from '../quote/dto/generate-premium.dto';
import type { BuildTransactionDto } from './dto/build-transaction.dto';
import { PolicyService } from './policy.service';

const VALID_HOLDER = 'GDVOEGATQV4FGUJKDEBEYT5NAPWJ55MEMJVLC5TU7Y74WD73PPAS4TYW';

const SUCCESS_RESULT: BuildTransactionResult = {
  unsignedXdr: 'AAAA==',
  minResourceFee: '500000',
  baseFee: '100',
  totalEstimatedFee: '500100',
  totalEstimatedFeeXlm: '0.0500100',
  authRequirements: [{ address: VALID_HOLDER, isContract: false }],
  memoConvention: 'NiffyInsure does not use memos for protocol correlation.',
  currentLedger: 100000,
};

const VALID_DTO: BuildTransactionDto = {
  holder: VALID_HOLDER,
  policy_type: PolicyTypeEnum.Auto,
  region: RegionTierEnum.Low,
  age_band: AgeBandEnum.Adult,
  coverage_type: CoverageTypeEnum.Basic,
  safety_score: 74,
  base_amount: '1000000000',
};

describe('PolicyService.buildTransaction', () => {
  const mockBuild = jest.fn<Promise<BuildTransactionResult>, [unknown]>();
  const service = new PolicyService({
    buildInitiatePolicyTransaction: mockBuild,
  } as never);

  beforeEach(() => {
    mockBuild.mockReset();
  });

  it('returns assembled transaction result on success', async () => {
    mockBuild.mockResolvedValue(SUCCESS_RESULT);

    const result = await service.buildTransaction(VALID_DTO);

    expect(result.unsignedXdr).toBe('AAAA==');
    expect(result.authRequirements).toHaveLength(1);
    expect(result.authRequirements[0].address).toBe(VALID_HOLDER);
    expect(result.memoConvention).toBeTruthy();
  });

  it('passes baseAmount as BigInt to the Soroban client', async () => {
    mockBuild.mockResolvedValue(SUCCESS_RESULT);

    await service.buildTransaction(VALID_DTO);

    expect(mockBuild).toHaveBeenCalledWith(
      expect.objectContaining({ baseAmount: BigInt('1000000000') }),
    );
  });

  it('propagates upstream errors unchanged', async () => {
    const error = new Error('Account does not exist on this network.');
    mockBuild.mockRejectedValue(error);

    await expect(service.buildTransaction(VALID_DTO)).rejects.toBe(error);
  });

  it('passes optional beneficiary to the client', async () => {
    mockBuild.mockResolvedValue(SUCCESS_RESULT);
    const ben = 'GBZXGXC7FNSLJ7C2ZFXFPN2Z6WQI4HIQ7S3STHXE2E5F7VRUXG4ZGSN4';

    await service.buildTransaction({
      ...VALID_DTO,
      beneficiary: ben,
    });

    expect(mockBuild).toHaveBeenCalledWith(
      expect.objectContaining({ beneficiary: ben }),
    );
  });
});
