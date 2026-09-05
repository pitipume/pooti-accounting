import { Module } from '@nestjs/common';
import { SheetsModule } from '../sheets/sheets.module';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  imports: [SheetsModule],
  controllers: [FeatureFlagsController],
})
export class FeatureFlagsModule {}
