import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Crown,
  CreditCard,
  LogOut,
  Lock,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { order, study } from '@client/src/api';
import { useAuth } from '@client/src/hooks/useAuth';
import { cn } from '@client/src/utils/cn';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@client/src/components/ui/empty';
import {
  ORDER_STATUS_LABELS,
} from '@shared/api.interface';
import type { OrderStatus } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'border-border bg-secondary text-muted-foreground',
  pending_confirmation: 'border-primary text-primary bg-primary/5',
  paid: 'border-success text-success bg-success/5',
  cancelled: 'border-border bg-secondary text-muted-foreground',
  expired: 'border-border bg-secondary text-muted-foreground',
};

function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-sm" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-7 w-12" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="h-20 w-full" />
      </Card>
      <Card className="p-5">
        <Skeleton className="mb-4 h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, logout } = useAuth();

  const { data: studyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['studyStats'],
    queryFn: () => study.getStudyStats(),
    enabled: !!user,
  });

  const { data: wrongStats, isLoading: wrongLoading } = useQuery({
    queryKey: ['wrongStats'],
    queryFn: () => study.getWrongStats(),
    enabled: !!user,
  });

  const { data: entitlements, isLoading: entitlementsLoading } = useQuery({
    queryKey: ['entitlements'],
    queryFn: () => order.getEntitlements(),
    enabled: !!user,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => order.getOrders({ pageSize: 10 }),
    enabled: !!user,
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) => order.payOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['entitlements'] });
    },
    onError: (err) => {
      logger.error('支付失败', err);
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 未登录重定向
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return <ProfileSkeleton />;
  }

  const vipEntitlement = entitlements?.find((e) => e.entitlementType === 'vip');
  const universityEntitlements = entitlements?.filter(
    (e) => e.entitlementType === 'university',
  ) ?? [];

  const orders = ordersData?.items ?? [];
  const recentOrders = orders.slice(0, 5);

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const initial = user.nickname
    ? user.nickname.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="space-y-8 px-4 py-8 md:px-10 md:py-12">
      {/* 页面标题 */}
      <div className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">个人中心</h1>
      </div>

      {/* 账号信息区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex size-16 items-center justify-center rounded-sm bg-primary text-2xl font-semibold text-primary-foreground font-heading">
              {initial}
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {user.nickname || user.email}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {vipEntitlement && (
                <Badge variant="outline" className="mt-2 border-primary text-primary">
                  <Crown className="mr-1 size-3" strokeWidth={1.5} />
                  VIP会员  有效期至 {formatDate(vipEntitlement.expiresAt)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {}}>
                <Lock className="size-4" strokeWidth={1.5} />
                修改密码
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleLogout()}
              >
                <LogOut className="size-4" strokeWidth={1.5} />
                退出登录
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学习概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">学习概览</CardTitle>
          <CardDescription>你的刷题数据统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-0 border-t border-border lg:grid-cols-4" data-ai-section-type="card-stat">
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <div className="text-sm text-muted-foreground">
                已答题数
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : (
                <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-foreground">
                  {studyStats?.answeredCount ?? 0}
                </div>
              )}
            </div>
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <div className="text-sm text-muted-foreground">
                正确题数
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : (
                <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-success">
                  {studyStats?.correctCount ?? 0}
                </div>
              )}
            </div>
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <div className="text-sm text-muted-foreground">
                正确率
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : (
                <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-primary">
                  {studyStats?.accuracy
                    ? `${(studyStats.accuracy * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="text-sm text-muted-foreground">
                错题数
              </div>
              {wrongLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : (
                <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-destructive">
                  {wrongStats?.totalWrong ?? studyStats?.wrongCount ?? 0}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 我的权益 */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">我的权益</CardTitle>
          <CardDescription>已解锁的会员和院校真题</CardDescription>
        </CardHeader>
        <CardContent>
          {entitlementsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : entitlements && entitlements.length > 0 ? (
            <div className="space-y-5">
              {/* VIP 会员 */}
              {vipEntitlement && (
                <div className="flex items-center justify-between border-l-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="size-5 text-primary" strokeWidth={1.5} />
                    <div>
                      <div className="font-medium text-foreground">
                        VIP 会员
                      </div>
                      <div className="text-sm text-muted-foreground">
                        有效期至 {formatDate(vipEntitlement.expiresAt)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    已开通
                  </Badge>
                </div>
              )}

              {/* 已解锁院校 */}
              {universityEntitlements.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="mb-3 text-sm font-medium text-muted-foreground">
                    已解锁院校（{universityEntitlements.length}所）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {universityEntitlements.map((e) => (
                      <Badge
                        key={e.id}
                        variant="outline"
                        className="border-border bg-secondary text-muted-foreground"
                      >
                        {e.targetId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Empty className="border-dashed py-8">
              <EmptyMedia variant="icon">
                <Crown className="size-6" />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>暂无权益</EmptyTitle>
                <EmptyDescription>
                  开通会员或购买院校真题包，解锁更多内容
                </EmptyDescription>
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={() => navigate('/vip')}
                >
                  去开通
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* 我的订单 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-base">我的订单</CardTitle>
            <CardDescription>最近的购买记录</CardDescription>
                  </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <Empty className="border-dashed py-8">
              <EmptyMedia variant="icon">
                <CreditCard className="size-6" />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>暂无订单</EmptyTitle>
                <EmptyDescription>
                  还没有购买记录，去看看会员权益吧
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-0">
              {recentOrders.map((o, idx: number) => (
                <div
                  key={o.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 py-3',
                    idx < recentOrders.length - 1 && 'border-b border-border',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {o.productName}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      下单时间：{formatDate(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground font-mono tabular-nums">
                        ¥{o.amount}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          ORDER_STATUS_BADGE[o.status] ??
                            'bg-secondary text-secondary-foreground',
                        )}
                      >
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                    </div>
                    {o.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => payMutation.mutate(o.id)}
                        disabled={payMutation.isPending}
                      >
                        去支付
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {orders.length > 5 && (
                <div className="pt-3 text-center border-t border-border">
                  <Link
                    to="/orders"
                    className="text-sm text-primary hover:underline"
                  >
                    查看全部订单
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
