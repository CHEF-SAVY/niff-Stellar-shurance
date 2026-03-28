import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SorobanService } from '../rpc/soroban.service';
import { GetPoliciesBatchDto } from './dto/get-policies-batch.dto';

@ApiTags('chain')
@Controller('chain')
export class ChainController {
  constructor(private readonly soroban: SorobanService) {}

  @Post('policies/batch')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Batch-read policies via Soroban simulation',
    description:
      'Invokes get_policies_batch in a single simulated transaction. Missing policies appear as null in the same positions as the request keys. Over 20 keys returns 400.',
  })
  async getPoliciesBatch(
    @Body() dto: GetPoliciesBatchDto,
  ): Promise<{ results: (Record<string, unknown> | null)[] }> {
    const results = await this.soroban.simulateGetPoliciesBatch({
      keys: dto.keys.map((k) => ({ holder: k.holder, policy_id: k.policy_id })),
      sourceAccount: dto.source_account,
    });
    return { results };
  }
}
