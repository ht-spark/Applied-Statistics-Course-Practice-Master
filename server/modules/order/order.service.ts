import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, count, desc, eq, gt, or } from 'drizzle-orm';
import type { Order, PageResult, Product, UserEntitlement } from '@shared/api.interface';
import { ORDER_STATUSES, PAYMENT_METHODS, PRODUCT_TYPES } from '@shared/api.interface';
import {
  orders as ordersTable,
  products as productsTable,
  userEntitlements as userEntitlementsTable,
  examPapers as examPapersTable,
} from '@server/database/schema';
import { ConfirmScanPayDto, CreateOrderDto, OrderListQueryDto } from './order.dto';

@Injectable()
export class OrderService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async listProducts(): Promise<Product[]> {
    const rows = await this.db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(asc(productsTable.sortOrder));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      productType: row.productType as Product['productType'],
      targetId: row.targetId,
      price: String(row.price),
      originalPrice: String(row.originalPrice),
      durationDays: row.durationDays,
      isActive: row.isActive,
    }));
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const product = await this.db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, dto.productId), eq(productsTable.isActive, true)))
      .limit(1);

    if (product.length === 0) {
      throw new NotFoundException('商品不存在或已下架');
    }

    const p = product[0];
    const rows = await this.db
      .insert(ordersTable)
      .values({
        userId,
        productId: p.id,
        productName: p.name,
        amount: p.price,
        status: 'pending',
      })
      .returning();

    const order = rows[0];
    return this.toOrderDto(order);
  }

  async listOrders(
    userId: string,
    query: OrderListQueryDto,
  ): Promise<PageResult<Order>> {
    const { page, pageSize, status } = query;
    const offset = (page - 1) * pageSize;

    const whereConditions = [eq(ordersTable.userId, userId)];
    if (status) {
      whereConditions.push(eq(ordersTable.status, status));
    }
    const where = and(...whereConditions);

    const [totalResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(ordersTable)
        .where(where),
      this.db
        .select()
        .from(ordersTable)
        .where(where)
        .orderBy(desc(ordersTable.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      items: rows.map((r) => this.toOrderDto(r)),
      total,
      page,
      pageSize,
    };
  }

  async getOrder(userId: string, orderId: string): Promise<Order> {
    const rows = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('订单不存在');
    }

    return this.toOrderDto(rows[0]);
  }

  async payOrder(userId: string, orderId: string): Promise<Order> {
    const orderRows = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('订单不存在');
    }

    const order = orderRows[0];
    if (order.status !== 'pending' && order.status !== 'pending_confirmation') {
      throw new BadRequestException('订单状态不支持支付');
    }

    const productRows = await this.db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, order.productId))
      .limit(1);

    if (productRows.length === 0) {
      throw new NotFoundException('关联商品不存在');
    }

    const product = productRows[0];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);

    let entitlementType: 'vip' | 'university' | 'paper';
    let targetId: string;

    if (product.productType === 'vip') {
      entitlementType = 'vip';
      targetId = '';
    } else if (product.productType === 'university_bundle') {
      entitlementType = 'university';
      targetId = product.targetId;
    } else if (product.productType === 'paper_bundle') {
      entitlementType = 'paper';
      targetId = product.targetId;
    } else {
      throw new BadRequestException('未知商品类型');
    }

    const paidOrder = await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(ordersTable)
        .set({
          status: 'paid',
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new ConflictException('支付失败，请重试');
      }

      await tx.insert(userEntitlementsTable).values({
        userId,
        entitlementType,
        targetId,
        expiresAt,
        orderId,
      });

      return updated[0];
    });

    return this.toOrderDto(paidOrder);
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const orderRows = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('订单不存在');
    }

    if (orderRows[0].status !== 'pending' && orderRows[0].status !== 'pending_confirmation') {
      throw new BadRequestException('只有待支付或待确认订单可以取消');
    }

    const updated = await this.db
      .update(ordersTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    return this.toOrderDto(updated[0]);
  }

  async confirmScanPay(
    userId: string,
    orderId: string,
    dto: ConfirmScanPayDto,
  ): Promise<Order> {
    const orderRows = await this.db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('订单不存在');
    }

    const order = orderRows[0];
    if (order.status !== 'pending' && order.status !== 'pending_confirmation') {
      throw new BadRequestException('订单状态不支持扫码支付');
    }

    const now = new Date();
    const updated = await this.db
      .update(ordersTable)
      .set({
        status: 'pending_confirmation',
        paymentMethod: dto.payMethod,
        updatedAt: now,
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (updated.length === 0) {
      throw new ConflictException('更新失败，请重试');
    }

    return this.toOrderDto(updated[0]);
  }

  async listEntitlements(userId: string): Promise<UserEntitlement[]> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(userEntitlementsTable)
      .where(
        and(
          eq(userEntitlementsTable.userId, userId),
          gt(userEntitlementsTable.expiresAt, now),
        ),
      )
      .orderBy(desc(userEntitlementsTable.createdAt));

    return rows.map((r) => ({
      id: r.id,
      entitlementType: r.entitlementType as UserEntitlement['entitlementType'],
      targetId: r.targetId,
      expiresAt: r.expiresAt.toISOString(),
      orderId: r.orderId,
    }));
  }

  async checkUniversity(userId: string, universityId: string): Promise<{ unlocked: boolean }> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(userEntitlementsTable)
      .where(
        and(
          eq(userEntitlementsTable.userId, userId),
          gt(userEntitlementsTable.expiresAt, now),
          or(
            eq(userEntitlementsTable.entitlementType, 'vip'),
            and(
              eq(userEntitlementsTable.entitlementType, 'university'),
              eq(userEntitlementsTable.targetId, universityId),
            ),
          ),
        ),
      )
      .limit(1);

    return { unlocked: rows.length > 0 };
  }

  async checkPaper(userId: string, paperId: string): Promise<{ unlocked: boolean }> {
    const now = new Date();

    // Check vip or direct paper entitlement first
    const directRows = await this.db
      .select()
      .from(userEntitlementsTable)
      .where(
        and(
          eq(userEntitlementsTable.userId, userId),
          gt(userEntitlementsTable.expiresAt, now),
          or(
            eq(userEntitlementsTable.entitlementType, 'vip'),
            and(
              eq(userEntitlementsTable.entitlementType, 'paper'),
              eq(userEntitlementsTable.targetId, paperId),
            ),
          ),
        ),
      )
      .limit(1);

    if (directRows.length > 0) {
      return { unlocked: true };
    }

    // Check university bundle entitlement
    const paperRows = await this.db
      .select({ universityId: examPapersTable.universityId })
      .from(examPapersTable)
      .where(eq(examPapersTable.id, paperId))
      .limit(1);

    if (paperRows.length === 0) {
      throw new NotFoundException('套卷不存在');
    }

    const universityId = paperRows[0].universityId;

    const universityRows = await this.db
      .select()
      .from(userEntitlementsTable)
      .where(
        and(
          eq(userEntitlementsTable.userId, userId),
          gt(userEntitlementsTable.expiresAt, now),
          eq(userEntitlementsTable.entitlementType, 'university'),
          eq(userEntitlementsTable.targetId, universityId),
        ),
      )
      .limit(1);

    return { unlocked: universityRows.length > 0 };
  }

  private toOrderDto(row: typeof ordersTable.$inferSelect): Order {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      productName: row.productName,
      amount: String(row.amount),
      status: this.normalizeStatus(row.status),
      paymentMethod: this.normalizePaymentMethod(row.paymentMethod),
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private normalizeStatus(status: string): Order['status'] {
    if ((ORDER_STATUSES as readonly string[]).includes(status)) {
      return status as Order['status'];
    }
    return 'pending';
  }

  private normalizePaymentMethod(method: string): Order['paymentMethod'] {
    if ((PAYMENT_METHODS as readonly string[]).includes(method)) {
      return method as Order['paymentMethod'];
    }
    return 'mock';
  }
}
