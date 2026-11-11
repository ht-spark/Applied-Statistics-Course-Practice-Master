import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { QUESTION_TYPES } from '@shared/api.interface';

// 提交答案
export class SubmitAnswerDto {
  @IsString()
  userAnswer!: string;
}

// 收藏切换
export class ToggleFavoriteDto {
  @IsBoolean()
  favorite!: boolean;
}

// 标记错题掌握状态
export class MarkMasteredDto {
  @IsBoolean()
  mastered!: boolean;
}

// 收藏列表分页
export class FavoritesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

// 错题列表查询
export class WrongQuestionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  universityId?: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  @IsIn(QUESTION_TYPES)
  questionType?:
    | 'single_choice'
    | 'multiple_choice'
    | 'true_false'
    | 'calculation'
    | 'short_answer';
}
