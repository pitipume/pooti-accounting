import { Module } from '@nestjs/common';
import { SheetsModule } from '../sheets/sheets.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [SheetsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
