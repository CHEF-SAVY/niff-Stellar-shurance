import { Module } from '@nestjs/common';
import { TxController } from './tx.controller';
import { TxService } from './tx.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  // CacheModule is @Global() so RedisService is available without importing here.
  // AuthModule exports PassportModule needed by OptionalJwtAuthGuard.
  imports: [AuthModule],
  controllers: [TxController],
  providers: [TxService],
})
export class TxModule {}
