import { Module } from '@nestjs/common';
import { SheetsModule } from '../sheets/sheets.module';
import { BranchesController } from './branches.controller';

@Module({
  imports: [SheetsModule],
  controllers: [BranchesController],
})
export class BranchesModule {}
