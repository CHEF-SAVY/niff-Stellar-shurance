/**
 * OptionalJwtAuthGuard — allows unauthenticated requests through.
 *
 * When a valid JWT Bearer token is present, req.user is populated with
 * { walletAddress: string } for per-user audit logging and rate limiting.
 * When absent or invalid, the request proceeds as anonymous.
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Always allow — JWT is optional
    return super.canActivate(context);
  }

  // Override to suppress UnauthorizedException for missing/invalid tokens
  handleRequest<TUser = unknown>(
    _err: Error | null,
    user: TUser | false,
  ): TUser | null {
    return user || null;
  }
}
