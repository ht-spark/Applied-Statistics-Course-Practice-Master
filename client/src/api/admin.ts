import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export interface CreateUniversityDto {
  name: string;
  shortName: string;
  location?: string;
  description?: string;
  isPremium: boolean;
  price: number;
  sortOrder: number;
}

export interface UpdateUniversityDto extends Partial<CreateUniversityDto> {}

export interface CreatePaperDto {
  universityId: string;
  year: number;
  title: string;
  description?: string;
  totalScore?: number;
  duration?: number;
  isPremium: boolean;
  sortOrder: number;
}

export interface CreateOptionDto {
  optionKey: string;
  content: string;
  sortOrder?: number;
}

export interface CreateQuestionDto {
  paperId: string;
  questionType: string;
  questionNumber: number;
  content: string;
  correctAnswer: string;
  analysis?: string;
  score?: number;
  difficulty?: number;
  knowledgePoint?: string;
  options: CreateOptionDto[];
}

export interface UpdateQuestionDto extends Partial<Omit<CreateQuestionDto, 'paperId'>> {}

export interface CreateProductDto {
  name: string;
  description?: string;
  productType: string;
  targetId?: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
}

export async function createUniversity(data: CreateUniversityDto): Promise<unknown> {
  const res = await axiosForBackend.post('/api/admin/universities', data);
  return res.data;
}

export async function updateUniversity(id: string, data: UpdateUniversityDto): Promise<unknown> {
  const res = await axiosForBackend.patch(`/api/admin/universities/${id}`, data);
  return res.data;
}

export async function deleteUniversity(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/universities/${id}`);
}

export async function createPaper(data: CreatePaperDto): Promise<unknown> {
  const res = await axiosForBackend.post('/api/admin/papers', data);
  return res.data;
}

export async function updatePaper(id: string, data: Partial<CreatePaperDto>): Promise<unknown> {
  const res = await axiosForBackend.patch(`/api/admin/papers/${id}`, data);
  return res.data;
}

export async function deletePaper(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/papers/${id}`);
}

export async function createQuestion(data: CreateQuestionDto): Promise<unknown> {
  const res = await axiosForBackend.post('/api/admin/questions', data);
  return res.data;
}

export async function updateQuestion(id: string, data: UpdateQuestionDto): Promise<unknown> {
  const res = await axiosForBackend.patch(`/api/admin/questions/${id}`, data);
  return res.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/questions/${id}`);
}

export async function createProduct(data: CreateProductDto): Promise<unknown> {
  const res = await axiosForBackend.post('/api/admin/products', data);
  return res.data;
}

export async function updateProduct(id: string, data: Partial<CreateProductDto>): Promise<unknown> {
  const res = await axiosForBackend.patch(`/api/admin/products/${id}`, data);
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/products/${id}`);
}

// ==================== 收款码配置 ====================

export interface PaymentQrCode {
  id: string;
  payMethod: string;
  imageUrl: string;
}

export async function getQrCodes(): Promise<PaymentQrCode[]> {
  const res = await axiosForBackend.get('/api/admin/qr-codes');
  return res.data;
}

export async function updateQrCode(
  payMethod: string,
  imageUrl: string,
): Promise<PaymentQrCode> {
  const res = await axiosForBackend.patch(`/api/admin/qr-codes/${payMethod}`, {
    imageUrl,
  });
  return res.data;
}

// ==================== 订单管理 ====================

export interface AdminOrderListResult {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: string;
  status: string;
  paymentMethod: string;
  paidAt: string | null;
  createdAt: string;
}

export async function getAdminOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<AdminOrderListResult> {
  const res = await axiosForBackend.get('/api/admin/orders', { params });
  return res.data;
}

export async function confirmOrderPaid(id: string): Promise<OrderItem> {
  const res = await axiosForBackend.post(`/api/admin/orders/${id}/confirm-paid`);
  return res.data;
}
