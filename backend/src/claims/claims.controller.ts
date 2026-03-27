import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Post,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClaimsService } from './claims.service';
import { ClaimsListResponseDto, ClaimDetailResponseDto } from './dto/claim.dto';
import { BuildClaimTransactionDto } from './dto/build-claim-transaction.dto';
import { SubmitTransactionDto } from './dto/submit-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletAddress } from '../auth/decorators/wallet-address.decorator';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { MAX_LIMIT, DEFAULT_LIMIT } from '../helpers/pagination';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @ApiOperation({ summary: 'List claims with cursor-based pagination' })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
    description: 'Opaque cursor from a previous response next_cursor. Omit for the first page.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Items per page. Clamped to [1, ${MAX_LIMIT}]. Default ${DEFAULT_LIMIT}.`,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    description: 'Filter by claim status.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of claims', type: ClaimsListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid cursor' })
  async listClaims(
    @Query('after') after?: string,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe) limit?: number,
    @Query('status') status?: string,
  ): Promise<ClaimsListResponseDto> {
    return this.claimsService.listClaims({ after, limit, status });
  }

  @Get('needs-my-vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get claims requiring the authenticated user to vote' })
  @ApiQuery({
    name: 'after',
    required: false,
    type: String,
    description: 'Opaque cursor from a previous response next_cursor.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Items per page. Clamped to [1, ${MAX_LIMIT}]. Default ${DEFAULT_LIMIT}.`,
  })
  @ApiResponse({ status: 200, description: 'Claims where user has not voted yet', type: ClaimsListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid cursor' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getClaimsNeedingMyVote(
    @WalletAddress() walletAddress: string,
    @Query('after') after?: string,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe) limit?: number,
  ): Promise<ClaimsListResponseDto> {
    return this.claimsService.getClaimsNeedingVote(walletAddress, { after, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed claim view' })
  @ApiResponse({ status: 200, description: 'Detailed claim with vote tallies', type: ClaimDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async getClaim(@Param('id', ParseIntPipe) id: number): Promise<ClaimDetailResponseDto> {
    return this.claimsService.getClaimById(id);
  }

  @Post('build-transaction')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Build unsigned file_claim transaction' })
  @ApiResponse({ status: 200, description: 'Unsigned transaction XDR + fee estimates' })
  async buildTransaction(@Body() dto: BuildClaimTransactionDto) {
    return this.claimsService.buildTransaction({
      holder: dto.holder,
      policyId: dto.policyId,
      amount: BigInt(dto.amount),
      details: dto.details,
      imageUrls: dto.imageUrls,
    });
  }

  @Post('submit')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit signed claim transaction' })
  @ApiResponse({ status: 200, description: 'Transaction submitted' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submitTransaction(@Body() dto: SubmitTransactionDto) {
    return this.claimsService.submitTransaction(dto.transactionXdr);
  }
}
