import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SheetsService } from '../sheets/sheets.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CurrentLiffProfile } from './liff-profile.decorator';
import { LiffAuthGuard, LiffProfile } from './liff-auth.guard';

// M2: single hardcoded branch. Real per-manager branch resolution via
// BranchService + the BranchManagers sheet tab arrives in M3.
const HARDCODED_BRANCH_CODE = 'MAIN';
const HARDCODED_BRANCH_NAME = 'Pooti (Test Branch)';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly sheets: SheetsService) {}

  @Post()
  @UseGuards(LiffAuthGuard)
  async create(
    @Body() dto: CreateSubmissionDto,
    @CurrentLiffProfile() profile: LiffProfile,
  ): Promise<{ branchCode: string; branchName: string }> {
    await this.sheets.appendEntry({
      entryId: randomUUID(),
      businessDate: dto.businessDate,
      branchCode: HARDCODED_BRANCH_CODE,
      branchName: HARDCODED_BRANCH_NAME,
      incomeAmount: dto.incomeAmount,
      expenseAmount: dto.expenseAmount,
      notes: dto.notes,
      submittedByLineUserId: profile.userId,
      submittedByDisplayName: profile.displayName,
      idempotencyKey: dto.idempotencyKey,
      receivedAtTimestamp: new Date().toISOString(),
      status: 'OK',
    });

    return { branchCode: HARDCODED_BRANCH_CODE, branchName: HARDCODED_BRANCH_NAME };
  }
}
