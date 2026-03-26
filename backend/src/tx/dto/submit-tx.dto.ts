/**
 * DTO for POST /tx/submit
 *
 * Accepts a user-signed XDR envelope and submits it to the Soroban RPC.
 * The XDR is validated structurally before any network call is made.
 *
 * SECURITY: XDR is validated but never logged in full. Signing material
 *           (private keys, seed phrases) must never appear in this payload.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class SubmitTxDto {
  @ApiProperty({
    description:
      'Base64-encoded signed TransactionEnvelope XDR produced by the wallet after signing the unsigned XDR from POST /tx/build.',
    example: 'AAAAAgAAAAA...',
  })
  @IsString()
  // Base64 characters only — rejects obviously malformed payloads before XDR parse
  @Matches(/^[A-Za-z0-9+/]+=*$/, {
    message: 'signed_xdr must be a valid base64 string',
  })
  signed_xdr!: string;

  @ApiPropertyOptional({
    description:
      'Client-supplied idempotency key (UUID v4). Re-submitting the same key within the TTL window returns the cached result without hitting the network again.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4)
  idempotency_key?: string;
}
