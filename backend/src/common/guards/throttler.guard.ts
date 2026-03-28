import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extends NestJS ThrottlerGuard to:
 * - Key by wallet address (from JWT sub) when available, otherwise by IP.
 *   This prevents large corporate NATs from being punished collectively.
 * - Set Retry-After header on 429 responses.
 * - Emit a structured log on every throttle hit for ops alerting.
 */
@Injectable()
export class WalletAwareThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger('ThrottleHit');

  protected async getTracker(req: Request): Promise<string> {
    // Prefer wallet identity from JWT payload (attached by JwtStrategy / passport)
    const user = (req as Request & { user?: { walletAddress?: string } }).user;
    if (user?.walletAddress) {
      return `wallet:${user.walletAddress}`;
    }

    // Fall back to IP — honour X-Forwarded-For set by trusted proxy/CDN
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ??
      req.socket?.remoteAddress ??
      'unknown';

    return `ip:${ip}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: { ttl: number; limit: number; key: string; tracker: string; totalHits: number },
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<{ setHeader: (k: string, v: string | number) => void }>();

    const retryAfterSec = Math.ceil(throttlerLimitDetail.ttl / 1000);
    res.setHeader('Retry-After', retryAfterSec);

    // Structured log for ops dashboards / alerting
    this.logger.warn('Throttle limit hit', {
      tracker: throttlerLimitDetail.tracker,
      key: throttlerLimitDetail.key,
      totalHits: throttlerLimitDetail.totalHits,
      limit: throttlerLimitDetail.limit,
      retryAfterSec,
      method: req.method,
      path: req.path,
    });

    throw new ThrottlerException();
  }
}
