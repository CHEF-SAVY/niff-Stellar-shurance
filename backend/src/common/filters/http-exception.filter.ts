import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

/**
 * Maps Stellar / Soroban error strings to stable API error codes.
 * Keeps raw blockchain internals out of client-facing responses.
 */
const STELLAR_ERROR_MAP: Record<string, string> = {
  tx_failed: 'TRANSACTION_FAILED',
  tx_bad_auth: 'SIGNATURE_INVALID',
  tx_insufficient_fee: 'INSUFFICIENT_FEE',
  tx_no_account: 'INVALID_WALLET_ADDRESS',
  op_no_trust: 'TRANSACTION_FAILED',
  op_underfunded: 'INSUFFICIENT_BALANCE',
  ledgerClosed: 'LEDGER_CLOSED',
  timeout: 'TIMEOUT_ERROR',
};

function normalizeStellarError(raw: string): string | undefined {
  const lower = raw.toLowerCase();
  for (const [key, code] of Object.entries(STELLAR_ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) return code;
  }
  return undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Normalize Stellar error codes when present
    let errorCode: string | undefined;
    if (exception instanceof Error) {
      errorCode = normalizeStellarError(exception.message);
    }

    // Log 5xx errors with stack trace; 4xx are client errors — debug level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.debug(`${request.method} ${request.url} → ${status}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId, // correlation ID for support escalation
      ...(errorCode ? { error: errorCode } : {}),
      message:
        typeof rawResponse === 'string'
          ? rawResponse
          : (rawResponse as Record<string, unknown>).message ?? rawResponse,
    });
  }
}
