import { Controller, Get } from '@nestjs/common';
import { SheetsService } from '../sheets/sheets.service';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly sheets: SheetsService) {}

  @Get()
  async list(): Promise<Record<string, boolean>> {
    return this.sheets.getFeatureFlags();
  }
}
