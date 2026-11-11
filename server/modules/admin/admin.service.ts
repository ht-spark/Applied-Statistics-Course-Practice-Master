import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/context';
import { and, count, desc, eq } from 'drizzle-orm';
import {
  universities,
  examPapers,
  questions,
  questionOptions,
  products,
  paymentQrCodes,
  orders as ordersTable,
  userEntitlements as userEntitlementsTable,
} from '@server/database/schema';
import type { Order, PageResult, PaymentQrCode } from '@shared/api.interface';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@shared/api.interface';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== 院校 ====================

  async createUniversity(dto: CreateUniversityDto) {
    const [result] = await this.db
      .insert(universities)
      .values({
        name: dto.name,
        shortName: dto.shortName,
        location: dto.location,
        description: dto.description,
        logoUrl: '',
        isPremium: dto.isPremium ?? false,
        price: dto.price !== undefined ? String(dto.price) : '0',
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: universities.id });
    return result;
  }

  async updateUniversity(id: string, dto: UpdateUniversityDto) {
    const patch: Partial<typeof universities.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.shortName !== undefined) patch.shortName = dto.shortName;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.isPremium !== undefined) patch.isPremium = dto.isPremium;
    if (dto.price !== undefined) patch.price = String(dto.price);
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(universities)
      .set(patch)
      .where(eq(universities.id, id))
      .returning({ id: universities.id });
    if (updated.length === 0) {
      throw new NotFoundException('院校不存在');
    }
    return updated[0];
  }

  async deleteUniversity(id: string) {
    const deleted = await this.db
      .delete(universities)
      .where(eq(universities.id, id))
      .returning({ id: universities.id });
    if (deleted.length === 0) {
      throw new NotFoundException('院校不存在');
    }
    return { success: true };
  }

  // ==================== 套卷 ====================

  async createPaper(dto: CreatePaperDto) {
    const [result] = await this.db
      .insert(examPapers)
      .values({
        universityId: dto.universityId,
        year: dto.year,
        title: dto.title,
        description: dto.description,
        totalScore: dto.totalScore ?? 150,
        duration: dto.duration ?? 180,
        isPremium: dto.isPremium ?? false,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: examPapers.id });
    return result;
  }

  async updatePaper(id: string, dto: UpdatePaperDto) {
    const patch: Partial<typeof examPapers.$inferInsert> = {};
    if (dto.universityId !== undefined) patch.universityId = dto.universityId;
    if (dto.year !== undefined) patch.year = dto.year;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.totalScore !== undefined) patch.totalScore = dto.totalScore;
    if (dto.duration !== undefined) patch.duration = dto.duration;
    if (dto.isPremium !== undefined) patch.isPremium = dto.isPremium;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(examPapers)
      .set(patch)
      .where(eq(examPapers.id, id))
      .returning({ id: examPapers.id });
    if (updated.length === 0) {
      throw new NotFoundException('套卷不存在');
    }
    return updated[0];
  }

  async deletePaper(id: string) {
    const deleted = await this.db
      .delete(examPapers)
      .where(eq(examPapers.id, id))
      .returning({ id: examPapers.id });
    if (deleted.length === 0) {
      throw new NotFoundException('套卷不存在');
    }
    return { success: true };
  }

  // ==================== 题目 ====================

  async createQuestion(dto: CreateQuestionDto) {
    return this.db.transaction(async (tx) => {
      const [question] = await tx
        .insert(questions)
        .values({
          paperId: dto.paperId,
          questionType: dto.questionType,
          questionNumber: dto.questionNumber,
          content: dto.content,
          correctAnswer: dto.correctAnswer,
          analysis: dto.analysis,
          score: dto.score ?? 10,
          difficulty: dto.difficulty ?? 2,
          knowledgePoint: dto.knowledgePoint,
        })
        .returning({ id: questions.id });

      if (dto.options && dto.options.length > 0) {
        await tx.insert(questionOptions).values(
          dto.options.map((opt) => ({
            questionId: question.id,
            optionKey: opt.optionKey,
            content: opt.content,
            sortOrder: opt.sortOrder ?? 0,
          })),
        );
      }

      return question;
    });
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    return this.db.transaction(async (tx) => {
      const patch: Partial<typeof questions.$inferInsert> = {};
      if (dto.paperId !== undefined) patch.paperId = dto.paperId;
      if (dto.questionType !== undefined) patch.questionType = dto.questionType;
      if (dto.questionNumber !== undefined)
        patch.questionNumber = dto.questionNumber;
      if (dto.content !== undefined) patch.content = dto.content;
      if (dto.correctAnswer !== undefined) patch.correctAnswer = dto.correctAnswer;
      if (dto.analysis !== undefined) patch.analysis = dto.analysis;
      if (dto.score !== undefined) patch.score = dto.score;
      if (dto.difficulty !== undefined) patch.difficulty = dto.difficulty;
      if (dto.knowledgePoint !== undefined)
        patch.knowledgePoint = dto.knowledgePoint;

      if (Object.keys(patch).length === 0 && dto.options === undefined) {
        throw new BadRequestException('未提供可更新字段');
      }

      if (Object.keys(patch).length > 0) {
        const updated = await tx
          .update(questions)
          .set(patch)
          .where(eq(questions.id, id))
          .returning({ id: questions.id });
        if (updated.length === 0) {
          throw new NotFoundException('题目不存在');
        }
      }

      if (dto.options !== undefined) {
        const existing = await tx
          .select({ id: questions.id })
          .from(questions)
          .where(eq(questions.id, id));
        if (existing.length === 0) {
          throw new NotFoundException('题目不存在');
        }

        await tx
          .delete(questionOptions)
          .where(eq(questionOptions.questionId, id));

        if (dto.options.length > 0) {
          await tx.insert(questionOptions).values(
            dto.options.map((opt) => ({
              questionId: id,
              optionKey: opt.optionKey,
              content: opt.content,
              sortOrder: opt.sortOrder ?? 0,
            })),
          );
        }
      }

      return { id };
    });
  }

  async deleteQuestion(id: string) {
    const deleted = await this.db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });
    if (deleted.length === 0) {
      throw new NotFoundException('题目不存在');
    }
    return { success: true };
  }

  // ==================== 商品 ====================

  async createProduct(dto: CreateProductDto) {
    const [result] = await this.db
      .insert(products)
      .values({
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        targetId: dto.targetId,
        price: dto.price !== undefined ? String(dto.price) : '0',
        originalPrice:
          dto.originalPrice !== undefined ? String(dto.originalPrice) : '0',
        durationDays: dto.durationDays ?? 365,
        isActive: true,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: products.id });
    return result;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const patch: Partial<typeof products.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.productType !== undefined) patch.productType = dto.productType;
    if (dto.targetId !== undefined) patch.targetId = dto.targetId;
    if (dto.price !== undefined) patch.price = String(dto.price);
    if (dto.originalPrice !== undefined)
      patch.originalPrice = String(dto.originalPrice);
    if (dto.durationDays !== undefined) patch.durationDays = dto.durationDays;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (updated.length === 0) {
      throw new NotFoundException('商品不存在');
    }
    return updated[0];
  }

  async deleteProduct(id: string) {
    const updated = await this.db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (updated.length === 0) {
      throw new NotFoundException('商品不存在');
    }
    return { success: true };
  }

  // ==================== 收款码 ====================

  async listQrCodes(): Promise<PaymentQrCode[]> {
    const rows = await this.db
      .select()
      .from(paymentQrCodes)
      .orderBy(paymentQrCodes.payMethod);

    return rows.map((row) => ({
      id: row.id,
      payMethod: this.normalizePayMethod(row.payMethod),
      imageUrl: row.imageUrl,
    }));
  }

  async updateQrCode(
    payMethod: string,
    dto: UpdateQrCodeDto,
  ): Promise<PaymentQrCode> {
    const updated = await this.db
      .update(paymentQrCodes)
      .set({
        imageUrl: dto.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(paymentQrCodes.payMethod, payMethod))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('收款码配置不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      payMethod: this.normalizePayMethod(row.payMethod),
      imageUrl: row.imageUrl,
    };
  }

  // ==================== 管理员订单 ====================

  async listAdminOrders(
    query: AdminOrderListQueryDto,
  ): Promise<PageResult<Order>> {
    const { page, pageSize, status } = query;
    const offset = (page - 1) * pageSize;

    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(ordersTable.status, status));
    }
    const where = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;

    const baseSelect = this.db.select().from(ordersTable);
    const baseCount = this.db.select({ count: count() }).from(ordersTable);

    const totalQuery = where ? baseCount.where(where) : baseCount;
    const listQuery = where
      ? baseSelect
          .where(where)
          .orderBy(desc(ordersTable.createdAt))
          .limit(pageSize)
          .offset(offset)
      : baseSelect
          .orderBy(desc(ordersTable.createdAt))
          .limit(pageSize)
          .offset(offset);

    const [totalResult, rows] = await Promise.all([totalQuery, listQuery]);
    const total = Number(totalResult[0]?.count ?? 0);

    return {
      items: rows.map((r) => this.toOrderDto(r)),
      total,
      page,
      pageSize,
    };
  }

  async confirmOrderPaid(orderId: string): Promise<Order> {
    const orderRows = await this.db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('订单不存在');
    }

    const order = orderRows[0];
    if (order.status !== 'pending_confirmation') {
      throw new BadRequestException('只有待确认状态的订单可以确认支付');
    }

    const productRows = await this.db
      .select()
      .from(products)
      .where(eq(products.id, order.productId))
      .limit(1);

    if (productRows.length === 0) {
      throw new NotFoundException('关联商品不存在');
    }

    const product = productRows[0];
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + product.durationDays * 24 * 60 * 60 * 1000,
    );

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
        throw new ConflictException('确认支付失败，请重试');
      }

      await tx.insert(userEntitlementsTable).values({
        userId: order.userId,
        entitlementType,
        targetId,
        expiresAt,
        orderId,
      });

      return updated[0];
    });

    return this.toOrderDto(paidOrder);
  }

  // ==================== helpers ====================

  private toOrderDto(row: typeof ordersTable.$inferSelect): Order {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      productName: row.productName,
      amount: String(row.amount),
      status: this.normalizeStatus(row.status),
      paymentMethod: this.normalizePayMethod(row.paymentMethod),
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

  private normalizePayMethod(method: string): PaymentQrCode['payMethod'] {
    if ((PAYMENT_METHODS as readonly string[]).includes(method)) {
      return method as PaymentQrCode['payMethod'];
    }
    return 'mock';
  }
}
