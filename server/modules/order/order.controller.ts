import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Order, PageResult, Product, UserEntitlement } from '@shared/api.interface';
import { OrderService } from './order.service';
import { ConfirmScanPayDto, CreateOrderDto, OrderListQueryDto } from './order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ========== 商品相关（公开） ==========
  @Get('products')
  async listProducts(): Promise<Product[]> {
    return this.orderService.listProducts();
  }

  // ========== 订单相关（需登录） ==========
  @UseGuards(JwtAuthGuard)
  @Post('orders')
  async createOrder(
    @CurrentUser() userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.orderService.createOrder(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async listOrders(
    @CurrentUser() userId: string,
    @Query() query: OrderListQueryDto,
  ): Promise<PageResult<Order>> {
    return this.orderService.listOrders(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  async getOrder(
    @CurrentUser() userId: string,
    @Param('id') orderId: string,
  ): Promise<Order> {
    return this.orderService.getOrder(userId, orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/confirm-scan-pay')
  async confirmScanPay(
    @CurrentUser() userId: string,
    @Param('id') orderId: string,
    @Body() dto: ConfirmScanPayDto,
  ): Promise<Order> {
    return this.orderService.confirmScanPay(userId, orderId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/pay')
  async payOrder(
    @CurrentUser() userId: string,
    @Param('id') orderId: string,
  ): Promise<Order> {
    return this.orderService.payOrder(userId, orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/cancel')
  async cancelOrder(
    @CurrentUser() userId: string,
    @Param('id') orderId: string,
  ): Promise<Order> {
    return this.orderService.cancelOrder(userId, orderId);
  }

  // ========== 权益查询（需登录） ==========
  @UseGuards(JwtAuthGuard)
  @Get('entitlements')
  async listEntitlements(@CurrentUser() userId: string): Promise<UserEntitlement[]> {
    return this.orderService.listEntitlements(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('entitlements/check-university/:universityId')
  async checkUniversity(
    @CurrentUser() userId: string,
    @Param('universityId') universityId: string,
  ): Promise<{ unlocked: boolean }> {
    return this.orderService.checkUniversity(userId, universityId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('entitlements/check-paper/:paperId')
  async checkPaper(
    @CurrentUser() userId: string,
    @Param('paperId') paperId: string,
  ): Promise<{ unlocked: boolean }> {
    return this.orderService.checkPaper(userId, paperId);
  }
}
