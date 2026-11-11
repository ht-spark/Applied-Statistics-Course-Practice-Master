import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { Product, Order, OrderStatus, UserEntitlement, PaymentMethod } from '@shared/api.interface';

export async function getProducts(): Promise<Product[]> {
  const res = await axiosForBackend.get('/api/products');
  return res.data;
}

export async function createOrder(productId: string): Promise<Order> {
  const res = await axiosForBackend.post('/api/orders', { productId });
  return res.data;
}

export async function getOrders(params?: { page?: number; pageSize?: number; status?: OrderStatus }): Promise<{
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const res = await axiosForBackend.get('/api/orders', { params });
  return res.data;
}

export async function getOrderDetail(id: string): Promise<Order> {
  const res = await axiosForBackend.get(`/api/orders/${id}`);
  return res.data;
}

export async function payOrder(id: string): Promise<Order> {
  const res = await axiosForBackend.post(`/api/orders/${id}/pay`);
  return res.data;
}

export async function confirmScanPay(
  id: string,
  payMethod: PaymentMethod,
): Promise<Order> {
  const res = await axiosForBackend.post(`/api/orders/${id}/confirm-scan-pay`, {
    payMethod,
  });
  return res.data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const res = await axiosForBackend.post(`/api/orders/${id}/cancel`);
  return res.data;
}

export async function getEntitlements(): Promise<UserEntitlement[]> {
  const res = await axiosForBackend.get('/api/entitlements');
  return res.data;
}

export async function checkUniversityUnlocked(universityId: string): Promise<{ unlocked: boolean }> {
  const res = await axiosForBackend.get(`/api/entitlements/check-university/${universityId}`);
  return res.data;
}

export async function checkPaperUnlocked(paperId: string): Promise<{ unlocked: boolean }> {
  const res = await axiosForBackend.get(`/api/entitlements/check-paper/${paperId}`);
  return res.data;
}
