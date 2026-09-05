import { Controller, Get } from '@nestjs/common';
import { BranchRow, SheetsService } from '../sheets/sheets.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly sheets: SheetsService) {}

  @Get()
  async list(): Promise<BranchRow[]> {
    return this.sheets.getBranches();
  }
}
