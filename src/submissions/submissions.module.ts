import { Module } from '@nestjs/common';
import { SheetsModule } from '../sheets/sheets.module';
import { ImagesModule } from '../images/images.module';
import { SubmissionsController } from './submissions.controller';
import { LiffAuthGuard } from './liff-auth.guard';

@Module({
  imports: [SheetsModule, ImagesModule],
  controllers: [SubmissionsController],
  providers: [LiffAuthGuard],
})
export class SubmissionsModule {}
