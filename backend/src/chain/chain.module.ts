import { Module } from '@nestjs/common';
import { RpcModule } from '../rpc/rpc.module';
import { ChainController } from './chain.controller';

@Module({
  imports: [RpcModule],
  controllers: [ChainController],
})
export class ChainModule {}
