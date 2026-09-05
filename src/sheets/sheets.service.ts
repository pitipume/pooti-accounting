import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';

export interface EntryRow {
  entryId: string;
  businessDate: string;
  branchCode: string;
  branchName: string;
  incomeAmount: number;
  expenseAmount: number;
  category?: string;
  notes?: string;
  submittedByLineUserId: string;
  submittedByDisplayName: string;
  idempotencyKey: string;
  receivedAtTimestamp: string;
  status: 'OK' | 'CORRECTED' | 'VOID';
  correctionOfEntryId?: string;
  imageUrl?: string;
}

export interface BranchRow {
  branchCode: string;
  branchName: string;
}

export interface BranchManagerRow {
  lineUserId: string;
  branchCode: string;
  branchName: string;
  active: boolean;
  addedDate: string;
}

/**
 * Auth relies on Application Default Credentials: locally that's the key file
 * pointed to by GOOGLE_APPLICATION_CREDENTIALS, on Cloud Run it's the attached
 * service account — same code, no branching, no key file in production.
 */
@Injectable()
export class SheetsService {
  private readonly sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string;

  constructor(config: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = config.getOrThrow<string>('GOOGLE_SHEET_ID');
  }

  /** One submission can carry multiple line items — written as one batched append so they land as consecutive sheet rows. */
  async appendEntries(entries: EntryRow[]): Promise<void> {
    if (entries.length === 0) return;

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Entries!A:P',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: entries.map((entry) => [
          entry.entryId,
          entry.businessDate,
          entry.branchCode,
          entry.branchName,
          entry.incomeAmount,
          entry.expenseAmount,
          entry.incomeAmount - entry.expenseAmount,
          entry.category ?? '',
          entry.notes ?? '',
          entry.submittedByLineUserId,
          entry.submittedByDisplayName,
          entry.idempotencyKey,
          entry.receivedAtTimestamp,
          entry.status,
          entry.correctionOfEntryId ?? '',
          entry.imageUrl ?? '',
        ]),
      },
    });
  }

  /** Active branches for the submission form's dropdown. Maintained by hand in the Branches tab. */
  async getBranches(): Promise<BranchRow[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Branches!A2:C',
    });
    const rows = res.data.values ?? [];
    return rows
      .filter((row) => row[0] && row[2]?.toUpperCase() === 'TRUE')
      .map((row) => ({ branchCode: row[0], branchName: row[1] }));
  }

  /** Runtime feature toggles maintained by hand in the FeatureFlags tab — no redeploy needed to flip one. */
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'FeatureFlags!A2:B',
    });
    const rows = res.data.values ?? [];
    const flags: Record<string, boolean> = {};
    for (const row of rows) {
      if (row[0]) flags[row[0]] = row[1]?.toUpperCase() === 'TRUE';
    }
    return flags;
  }

  async getBranchManagers(): Promise<BranchManagerRow[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'BranchManagers!A2:E',
    });
    const rows = res.data.values ?? [];
    return rows
      .filter((row) => row[0])
      .map((row) => ({
        lineUserId: row[0],
        branchCode: row[1],
        branchName: row[2],
        active: row[3]?.toUpperCase() === 'TRUE',
        addedDate: row[4],
      }));
  }
}
