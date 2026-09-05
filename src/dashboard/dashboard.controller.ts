import { BadRequestException, Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntryRow, SheetsService } from '../sheets/sheets.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly sheets: SheetsService,
    private readonly config: ConfigService,
  ) {}

  @Get('entries')
  async entries(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('key') key: string,
  ): Promise<EntryRow[]> {
    const expectedKey = this.config.getOrThrow<string>('DASHBOARD_ACCESS_KEY');
    if (key !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing dashboard key');
    }
    if (!from || !to) {
      throw new BadRequestException('from and to query params are required');
    }
    return this.sheets.getEntries(from, to);
  }
}
