import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmissionItemDto {
  @IsIn(['income', 'outcome'])
  type!: 'income' | 'outcome';

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsDateString()
  businessDate!: string;

  @IsString()
  @IsNotEmpty()
  branchCode!: string;

  @IsString()
  @IsNotEmpty()
  branchName!: string;

  @ValidateNested({ each: true })
  @Type(() => SubmissionItemDto)
  @ArrayMinSize(1)
  items!: SubmissionItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  /** One optional receipt photo per submission — a browser canvas.toDataURL() string. */
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
