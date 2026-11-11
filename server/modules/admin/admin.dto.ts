import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ORDER_STATUSES,
  PRODUCT_TYPES,
  QUESTION_TYPES,
} from '@shared/api.interface';

// ==================== 院校 ====================

export class CreateUniversityDto {
  @IsString()
  name!: string;

  @IsString()
  shortName!: string;

  @IsString()
  location!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateUniversityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ==================== 套卷 ====================

export class CreatePaperDto {
  @IsUUID()
  universityId!: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePaperDto {
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ==================== 题目选项 ====================

export class QuestionOptionDto {
  @IsString()
  optionKey!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ==================== 题目 ====================

export class CreateQuestionDto {
  @IsUUID()
  paperId!: string;

  @IsString()
  @IsIn(QUESTION_TYPES)
  questionType!: 'single_choice' | 'multiple_choice' | 'true_false' | 'calculation' | 'short_answer';

  @IsInt()
  @Min(1)
  questionNumber!: number;

  @IsString()
  content!: string;

  @IsString()
  correctAnswer!: string;

  @IsString()
  analysis!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsString()
  knowledgePoint!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsUUID()
  paperId?: string;

  @IsOptional()
  @IsString()
  @IsIn(QUESTION_TYPES)
  questionType?: 'single_choice' | 'multiple_choice' | 'true_false' | 'calculation' | 'short_answer';

  @IsOptional()
  @IsInt()
  @Min(1)
  questionNumber?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsString()
  knowledgePoint?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

// ==================== 商品 ====================

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsIn(PRODUCT_TYPES)
  productType!: 'vip' | 'university_bundle' | 'paper_bundle';

  @IsString()
  targetId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(PRODUCT_TYPES)
  productType?: 'vip' | 'university_bundle' | 'paper_bundle';

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ==================== 收款码 ====================

export class UpdateQrCodeDto {
  @IsString()
  imageUrl!: string;
}

// ==================== 管理员订单 ====================

export class AdminOrderListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUSES)
  status?: 'pending' | 'pending_confirmation' | 'paid' | 'cancelled' | 'expired';
}
