import { Module } from '@nestjs/common';
import { RampController } from './ramp.controller';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [RampController],
})
export class RampModule {}
