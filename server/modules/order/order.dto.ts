import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@shared/api.interface';

export class CreateOrderDto {
  @IsString()
  @IsUUID()
  productId!: string;
}

export class ConfirmScanPayDto {
  @IsString()
  @IsIn(PAYMENT_METHODS)
  payMethod!: 'wechat' | 'alipay';
}

export class OrderListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUSES)
  status?: 'pending' | 'pending_confirmation' | 'paid' | 'cancelled' | 'expired';
}
