import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@client/src/hooks/useAuth';
import { order as orderApi } from '@client/src/api';
import type { Product, UserEntitlement, Order, ProductType, EntitlementType } from '@shared/api.interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';
import { Crown, Shield, AlertCircle, RefreshCw, Loader2, Check, QrCode, CreditCard } from 'lucide-react';
import { getApiErrorMessage } from '@client/src/lib/api-error';

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  vip: '会员',
  university_bundle: '院校真题包',
  paper_bundle: '套卷包',
};

const ENTITLEMENT_TYPE_LABELS: Record<EntitlementType, string> = {
  vip: '会员',
  university: '院校真题',
  paper: '套卷',
};

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3 w-3 mr-1" />
        重试
      </Button>
    </div>
  );
}

export default function VipPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [payMethodTab, setPayMethodTab] = useState<'mock' | 'scan'>('mock');
  const [selectedScanMethod, setSelectedScanMethod] = useState<'wechat' | 'alipay'>('wechat');

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => orderApi.getProducts(),
  });

  const {
    data: entitlements,
    isLoading: entitlementsLoading,
    isError: entitlementsError,
    refetch: refetchEntitlements,
  } = useQuery({
    queryKey: ['entitlements'],
    queryFn: () => orderApi.getEntitlements(),
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: (productId: string) => orderApi.createOrder(productId),
    onSuccess: (order: Order) => {
      setPendingOrderId(order.id);
      setPayDialogOpen(true);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '创建订单失败，请稍后重试'));
    },
  });

  const payOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderApi.payOrder(orderId),
    onSuccess: () => {
      toast.success('支付成功！权益已开通');
      setPayDialogOpen(false);
      setSelectedProduct(null);
      setPendingOrderId(null);
      void queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '支付失败，请稍后重试'));
    },
    retry: false,
  });

  const confirmScanPayMutation = useMutation({
    mutationFn: (orderId: string) =>
      orderApi.confirmScanPay(orderId, selectedScanMethod),
    onSuccess: () => {
      toast.success('已提交支付确认，管理员核实后将自动开通权益');
      setPayDialogOpen(false);
      setSelectedProduct(null);
      setPendingOrderId(null);
      setPayMethodTab('mock');
      setSelectedScanMethod('wechat');
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, '提交失败，请稍后重试'));
    },
    retry: false,
  });

  const handleBuy = (product: Product) => {
    if (!user) {
      toast.error('请先登录后再购买');
      return;
    }
    setSelectedProduct(product);
    createOrderMutation.mutate(product.id);
  };

  const handleConfirmPay = () => {
    if (pendingOrderId) {
      payOrderMutation.mutate(pendingOrderId);
    }
  };

  const handleClosePayDialog = () => {
    if (payOrderMutation.isPending || confirmScanPayMutation.isPending) return;
    setPayDialogOpen(false);
    setSelectedProduct(null);
    setPendingOrderId(null);
    setPayMethodTab('mock');
    setSelectedScanMethod('wechat');
  };

  const handleConfirmScanPay = () => {
    if (pendingOrderId) {
      confirmScanPayMutation.mutate(pendingOrderId);
    }
  };

  return (
    <div className="space-y-10 px-4 py-8 md:px-10 md:py-12">
      {/* 页标题 */}
      <div className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">会员中心</h1>
      </div>
      <p className="-mt-6 text-sm text-muted-foreground">解锁院校真题，备考更高效</p>

      {/* 权益状态 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />
            我的权益
          </CardTitle>
          <CardDescription>已开通的会员和院校真题包</CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">登录后查看你的权益状态</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">去登录</Link>
              </Button>
            </div>
          ) : entitlementsLoading ? (
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 flex-1 rounded-md" />
              ))}
            </div>
          ) : entitlementsError ? (
            <ErrorState message="权益信息加载失败" onRetry={refetchEntitlements} />
          ) : entitlements && entitlements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {entitlements.map((e: UserEntitlement) => (
                <Badge key={e.id} variant="outline" className="border-success text-success">
                  <Check className="h-3 w-3 mr-1" strokeWidth={1.5} />
                  {ENTITLEMENT_TYPE_LABELS[e.entitlementType] ?? e.entitlementType}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无开通的权益，选择下方商品立即开通</p>
          )}
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <section className="space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">全部商品</h2>
        </div>

        {productsLoading ? (
          <ProductsSkeleton />
        ) : productsError ? (
          <Card>
            <CardContent className="py-6">
              <ErrorState message="商品列表加载失败" onRetry={refetchProducts} />
            </CardContent>
          </Card>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product: Product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[product.productType] ?? product.productType}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-base mt-3">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                  <div className="flex items-baseline gap-2 border-t border-border pt-4">
                    <span className="text-3xl font-semibold text-primary font-mono tabular-nums">
                      ¥{product.price}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ¥{product.originalPrice}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleBuy(product)}
                    disabled={createOrderMutation.isPending && selectedProduct?.id === product.id}
                  >
                    {createOrderMutation.isPending && selectedProduct?.id === product.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        下单中...
                      </>
                    ) : (
                      '立即购买'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              暂无商品
            </CardContent>
          </Card>
        )}
      </section>

      {/* 支付弹窗 */}
      <Dialog open={payDialogOpen} onOpenChange={handleClosePayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认支付</DialogTitle>
            <DialogDescription>选择支付方式完成订单</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-2">
              <div className="rounded-sm border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">商品名称</span>
                  <span className="font-medium text-foreground">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">商品类型</span>
                  <span className="text-foreground">
                    {PRODUCT_TYPE_LABELS[selectedProduct.productType] ?? selectedProduct.productType}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="text-muted-foreground">应付金额</span>
                  <span className="text-2xl font-semibold text-primary font-mono tabular-nums">
                    ¥{selectedProduct.price}
                  </span>
                </div>
              </div>

              <Tabs value={payMethodTab} onValueChange={(v) => setPayMethodTab(v as 'mock' | 'scan')}>
                <TabsList className="w-full">
                  <TabsTrigger value="mock" className="flex-1">
                    模拟支付
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="flex-1">
                    扫码支付
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mock" className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    模拟支付环境，点击按钮即可完成支付并开通权益
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleConfirmPay}
                    disabled={payOrderMutation.isPending}
                  >
                    {payOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        支付中...
                      </>
                    ) : (
                      '立即支付（模拟）'
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="scan" className="pt-4">
                  <div className="space-y-4">
                    <RadioGroup
                      value={selectedScanMethod}
                      onValueChange={(v) => setSelectedScanMethod(v as 'wechat' | 'alipay')}
                      className="grid grid-cols-2 gap-3"
                    >
                      <Label
                        htmlFor="scan-wechat"
                        className={`flex items-center gap-2 rounded-sm border p-3 cursor-pointer transition-colors ${
                          selectedScanMethod === 'wechat'
                            ? 'border-primary bg-primary/5 border-l-2'
                            : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <RadioGroupItem value="wechat" id="scan-wechat" />
                        <QrCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                        <span className="text-sm font-medium">微信支付</span>
                      </Label>
                      <Label
                        htmlFor="scan-alipay"
                        className={`flex items-center gap-2 rounded-sm border p-3 cursor-pointer transition-colors ${
                          selectedScanMethod === 'alipay'
                            ? 'border-primary bg-primary/5 border-l-2'
                            : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <RadioGroupItem value="alipay" id="scan-alipay" />
                        <CreditCard className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                        <span className="text-sm font-medium">支付宝</span>
                      </Label>
                    </RadioGroup>

                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-[200px] w-[200px] items-center justify-center rounded-sm border border-border bg-secondary">
                        <p className="px-4 text-center text-sm text-muted-foreground">
                          {selectedScanMethod === 'wechat'
                            ? '微信收款码待上传'
                            : '支付宝收款码待上传'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        请使用{selectedScanMethod === 'wechat' ? '微信' : '支付宝'}扫描二维码完成支付
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleConfirmScanPay}
                      disabled={confirmScanPayMutation.isPending}
                    >
                      {confirmScanPayMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          提交中...
                        </>
                      ) : (
                        '我已完成支付'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePayDialog}
              disabled={payOrderMutation.isPending || confirmScanPayMutation.isPending}
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
