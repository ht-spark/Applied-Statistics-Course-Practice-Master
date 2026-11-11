/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, foreignKey, index, integer, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const paymentQrCodes = pgTable("payment_qr_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  payMethod: varchar("pay_method", { length: 20 }).notNull().unique(),
  imageUrl: text("image_url").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("payment_qr_codes_pay_method_key").on(table.payMethod),
]);

export const studyRecords = pgTable("study_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  paperId: uuid("paper_id").notNull(),
  questionId: uuid("question_id").notNull(),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct"),
  score: numeric("score"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("study_records_user_id_question_id_key").on(table.userId, table.questionId),
  index("idx_study_records_user_id").on(table.userId),
  foreignKey({
    columns: [table.paperId],
    foreignColumns: [examPapers.id],
    name: "study_records_paper_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "study_records_question_id_fkey",
  }).onDelete("cascade"),
]);

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questionId: uuid("question_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("favorites_user_id_question_id_key").on(table.userId, table.questionId),
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "favorites_question_id_fkey",
  }).onDelete("cascade"),
]);

export const wrongQuestions = pgTable("wrong_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questionId: uuid("question_id").notNull(),
  wrongCount: integer("wrong_count").notNull().default(1),
  lastWrongAnswer: text("last_wrong_answer").notNull(),
  lastWrongAt: customTimestamptz("last_wrong_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  mastered: boolean("mastered").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("wrong_questions_user_id_question_id_key").on(table.userId, table.questionId),
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "wrong_questions_question_id_fkey",
  }).onDelete("cascade"),
]);

export const userEntitlements = pgTable("user_entitlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  entitlementType: varchar("entitlement_type", { length: 20 }).notNull(),
  targetId: varchar("target_id", { length: 255 }).notNull(),
  expiresAt: customTimestamptz("expires_at", { precision: 3 }).notNull(),
  orderId: uuid("order_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_entitlements_user_id").on(table.userId),
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [orders.id],
    name: "user_entitlements_order_id_fkey",
  }),
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  amount: numeric("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  paidAt: customTimestamptz("paid_at", { precision: 3 }),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default('mock'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_orders_user_id").on(table.userId),
  foreignKey({
    columns: [table.productId],
    foreignColumns: [products.id],
    name: "orders_product_id_fkey",
  }),
]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  productType: varchar("product_type", { length: 20 }).notNull(),
  targetId: varchar("target_id", { length: 255 }).notNull(),
  price: numeric("price").notNull().default('0'),
  originalPrice: numeric("original_price").notNull().default('0'),
  durationDays: integer("duration_days").notNull().default(365),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const questionOptions = pgTable("question_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull(),
  optionKey: varchar("option_key", { length: 10 }).notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_question_options_question_id").on(table.questionId),
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "question_options_question_id_fkey",
  }).onDelete("cascade"),
]);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: uuid("paper_id").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(),
  questionNumber: integer("question_number").notNull(),
  content: text("content").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  analysis: text("analysis").notNull(),
  score: integer("score").notNull().default(10),
  difficulty: integer("difficulty").notNull().default(2),
  knowledgePoint: varchar("knowledge_point", { length: 200 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_questions_paper_id").on(table.paperId),
  foreignKey({
    columns: [table.paperId],
    foreignColumns: [examPapers.id],
    name: "questions_paper_id_fkey",
  }).onDelete("cascade"),
]);

export const examPapers = pgTable("exam_papers", {
  id: uuid("id").primaryKey().defaultRandom(),
  universityId: uuid("university_id").notNull(),
  year: integer("year").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  totalScore: integer("total_score").notNull().default(150),
  duration: integer("duration").notNull().default(180),
  isPremium: boolean("is_premium").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_exam_papers_university_id").on(table.universityId),
  foreignKey({
    columns: [table.universityId],
    foreignColumns: [universities.id],
    name: "exam_papers_university_id_fkey",
  }).onDelete("cascade"),
]);

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  shortName: varchar("short_name", { length: 50 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  description: text("description").notNull(),
  logoUrl: varchar("logo_url", { length: 500 }).notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  price: numeric("price").notNull().default('0'),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("app_users_email_key").on(table.email),
]);

// table aliases
export const appUsersTable = appUsers;
export const examPapersTable = examPapers;
export const favoritesTable = favorites;
export const ordersTable = orders;
export const paymentQrCodesTable = paymentQrCodes;
export const productsTable = products;
export const questionOptionsTable = questionOptions;
export const questionsTable = questions;
export const studyRecordsTable = studyRecords;
export const universitiesTable = universities;
export const userEntitlementsTable = userEntitlements;
export const wrongQuestionsTable = wrongQuestions;
