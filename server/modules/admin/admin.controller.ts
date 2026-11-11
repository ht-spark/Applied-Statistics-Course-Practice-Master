import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import {
  CreateUniversityDto,
  UpdateUniversityDto,
  CreatePaperDto,
  UpdatePaperDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateQrCodeDto,
  AdminOrderListQueryDto,
} from './admin.dto';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 院校管理 ====================

  @Post('universities')
  async createUniversity(@Body() dto: CreateUniversityDto) {
    return this.adminService.createUniversity(dto);
  }

  @Patch('universities/:id')
  async updateUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUniversityDto,
  ) {
    return this.adminService.updateUniversity(id, dto);
  }

  @Delete('universities/:id')
  async deleteUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUniversity(id);
  }

  // ==================== 套卷管理 ====================

  @Post('papers')
  async createPaper(@Body() dto: CreatePaperDto) {
    return this.adminService.createPaper(dto);
  }

  @Patch('papers/:id')
  async updatePaper(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaperDto,
  ) {
    return this.adminService.updatePaper(id, dto);
  }

  @Delete('papers/:id')
  async deletePaper(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deletePaper(id);
  }

  // ==================== 题目管理 ====================

  @Post('questions')
  async createQuestion(@Body() dto: CreateQuestionDto) {
    return this.adminService.createQuestion(dto);
  }

  @Patch('questions/:id')
  async updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.adminService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  async deleteQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteQuestion(id);
  }

  // ==================== 商品管理 ====================

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ==================== 收款码管理 ====================

  @Get('qr-codes')
  async listQrCodes() {
    return this.adminService.listQrCodes();
  }

  @Patch('qr-codes/:payMethod')
  async updateQrCode(
    @Param('payMethod') payMethod: string,
    @Body() dto: UpdateQrCodeDto,
  ) {
    return this.adminService.updateQrCode(payMethod, dto);
  }

  // ==================== 订单管理 ====================

  @Get('orders')
  async listOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminService.listAdminOrders(query);
  }

  @Post('orders/:id/confirm-paid')
  async confirmOrderPaid(@Param('id') orderId: string) {
    return this.adminService.confirmOrderPaid(orderId);
  }
}
