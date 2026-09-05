import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsDateString()
  businessDate!: string;

  @IsNumber()
  @Min(0)
  incomeAmount!: number;

  @IsNumber()
  @Min(0)
  expenseAmount!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
