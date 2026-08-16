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

  async appendEntry(entry: EntryRow): Promise<void> {
    const netAmount = entry.incomeAmount - entry.expenseAmount;
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Entries!A:O',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            entry.entryId,
            entry.businessDate,
            entry.branchCode,
            entry.branchName,
            entry.incomeAmount,
            entry.expenseAmount,
            netAmount,
            entry.category ?? '',
            entry.notes ?? '',
            entry.submittedByLineUserId,
            entry.submittedByDisplayName,
            entry.idempotencyKey,
            entry.receivedAtTimestamp,
            entry.status,
            entry.correctionOfEntryId ?? '',
          ],
        ],
      },
    });
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
