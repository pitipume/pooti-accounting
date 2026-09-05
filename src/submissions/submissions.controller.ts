import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntryRow, SheetsService } from '../sheets/sheets.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CurrentLiffProfile } from './liff-profile.decorator';
import { LiffAuthGuard, LiffProfile } from './liff-auth.guard';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly sheets: SheetsService) {}

  @Post()
  @UseGuards(LiffAuthGuard)
  async create(
    @Body() dto: CreateSubmissionDto,
    @CurrentLiffProfile() profile: LiffProfile,
  ): Promise<{ branchCode: string; branchName: string; incomeAmount: number; expenseAmount: number }> {
    const receivedAtTimestamp = new Date().toISOString();

    // Each line item becomes its own sheet row, sharing the submission's
    // idempotencyKey (suffixed by index so per-row keys stay unique) so the
    // whole batch can still be traced back to one submit.
    const rows: EntryRow[] = dto.items.map((item, index) => ({
      entryId: randomUUID(),
      businessDate: dto.businessDate,
      branchCode: dto.branchCode,
      branchName: dto.branchName,
      incomeAmount: item.type === 'income' ? item.price : 0,
      expenseAmount: item.type === 'outcome' ? item.price : 0,
      category: item.name,
      notes: dto.notes,
      submittedByLineUserId: profile.userId,
      submittedByDisplayName: profile.displayName,
      idempotencyKey: `${dto.idempotencyKey}:${index}`,
      receivedAtTimestamp,
      status: 'OK',
    }));

    await this.sheets.appendEntries(rows);

    return {
      branchCode: dto.branchCode,
      branchName: dto.branchName,
      incomeAmount: rows.reduce((sum, r) => sum + r.incomeAmount, 0),
      expenseAmount: rows.reduce((sum, r) => sum + r.expenseAmount, 0),
    };
  }
}
