/* 前后端共享的类型写在这里 */

// 题目类型
export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'calculation',
  'short_answer',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const isQuestionType = (v: string): v is QuestionType =>
  (QUESTION_TYPES as readonly string[]).includes(v);
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  calculation: '计算题',
  short_answer: '简答题',
};

// 订单状态
export const ORDER_STATUSES = [
  'pending',
  'pending_confirmation',
  'paid',
  'cancelled',
  'expired',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const isOrderStatus = (v: string): v is OrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(v);
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待支付',
  pending_confirmation: '待确认',
  paid: '已支付',
  cancelled: '已取消',
  expired: '已过期',
};

// 支付方式
export const PAYMENT_METHODS = ['mock', 'wechat', 'alipay'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mock: '模拟支付',
  wechat: '微信支付',
  alipay: '支付宝',
};

// 商品类型
export const PRODUCT_TYPES = ['vip', 'university_bundle', 'paper_bundle'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

// 权益类型
export const ENTITLEMENT_TYPES = ['vip', 'university', 'paper'] as const;
export type EntitlementType = (typeof ENTITLEMENT_TYPES)[number];

// 题目选项
export interface QuestionOption {
  id: string;
  questionId: string;
  optionKey: string;
  content: string;
}

// 题目详情（含选项）
export interface QuestionDetail {
  id: string;
  paperId: string;
  questionType: QuestionType;
  questionNumber: number;
  content: string;
  correctAnswer: string;
  analysis: string;
  score: number;
  difficulty: number;
  knowledgePoint: string;
  options: QuestionOption[];
}

// 套卷概要
export interface ExamPaperSummary {
  id: string;
  universityId: string;
  year: number;
  title: string;
  description: string;
  totalScore: number;
  duration: number;
  isPremium: boolean;
  questionCount: number;
}

// 院校
export interface University {
  id: string;
  name: string;
  shortName: string;
  location: string;
  description: string;
  isPremium: boolean;
  price: string;
  paperCount: number;
}

// 用户信息
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

// 商品
export interface Product {
  id: string;
  name: string;
  description: string;
  productType: ProductType;
  targetId: string;
  price: string;
  originalPrice: string;
  durationDays: number;
  isActive: boolean;
}

// 订单
export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  createdAt: string;
}

// 收款码配置
export interface PaymentQrCode {
  id: string;
  payMethod: PaymentMethod;
  imageUrl: string;
}

// 用户权益
export interface UserEntitlement {
  id: string;
  entitlementType: EntitlementType;
  targetId: string;
  expiresAt: string;
  orderId: string;
}

// 学习记录
export interface StudyRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean | null;
  score: number | null;
  updatedAt: string;
}

// 错题
export interface WrongQuestion {
  id: string;
  questionId: string;
  wrongCount: number;
  lastWrongAnswer: string;
  lastWrongAt: string;
  mastered: boolean;
}

// 收藏
export interface Favorite {
  id: string;
  questionId: string;
  createdAt: string;
}

// 提交答题结果
export interface SubmitAnswerResponse {
  isCorrect: boolean | null;
  score: number | null;
  correctAnswer: string;
  analysis: string;
  addedToWrong: boolean;
}

// 学习统计
export interface StudyStats {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
}

// 分页响应
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
