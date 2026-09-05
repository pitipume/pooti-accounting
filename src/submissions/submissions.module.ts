import { Module } from '@nestjs/common';
import { SheetsModule } from '../sheets/sheets.module';
import { SubmissionsController } from './submissions.controller';
import { LiffAuthGuard } from './liff-auth.guard';

@Module({
  imports: [SheetsModule],
  controllers: [SubmissionsController],
  providers: [LiffAuthGuard],
})
export class SubmissionsModule {}
