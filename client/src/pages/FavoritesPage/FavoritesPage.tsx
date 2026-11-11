import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookmarkX, Star } from 'lucide-react';
import { question } from '@client/src/api';
import type { FavoriteListItem } from '@client/src/api/question';
import { useAuth } from '@client/src/hooks/useAuth';
import { cn } from '@client/src/utils/cn';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@client/src/components/ui/empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@client/src/components/ui/pagination';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
} from '@shared/api.interface';
import type { QuestionType } from '@shared/api.interface';

const PAGE_SIZE = 20;

const QUESTION_TYPE_BADGE_VARIANT: Record<QuestionType, string> = {
  single_choice: 'border-border bg-secondary text-muted-foreground',
  multiple_choice: 'border-border bg-secondary text-muted-foreground',
  true_false: 'border-border bg-secondary text-muted-foreground',
  calculation: 'border-border bg-secondary text-muted-foreground',
  short_answer: 'border-border bg-secondary text-muted-foreground',
};

function truncateContent(content: string, maxLen = 80): string {
  const firstLine = content.split('\n')[0] ?? content;
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen) + '...';
}

function FavoriteCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex justify-end pt-1">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="h-8 w-16" />
    </Card>
  );
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);

  const {
    data: favoritesData,
    isLoading: favLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => question.getFavorites(page, PAGE_SIZE),
    enabled: !!user,
  });

  const unfavoriteMutation = useMutation({
    mutationFn: (questionId: string) =>
      question.toggleFavorite(questionId, false),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const totalPages = useMemo(() => {
    if (!favoritesData) return 0;
    return Math.ceil(favoritesData.total / PAGE_SIZE);
  }, [favoritesData]);

  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <StatsSkeleton />
        <FavoriteCardSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Empty className="max-w-md border-solid">
          <EmptyMedia variant="icon">
            <Star className="size-6" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>登录后查看收藏</EmptyTitle>
            <EmptyDescription>
              登录后即可收藏题目，随时回顾复习
            </EmptyDescription>
            <Button
              className="mt-2"
              onClick={() => navigate('/login')}
            >
              去登录
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-8 md:px-10 md:py-12">
      {/* 页面标题 */}
      <div className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">我的收藏</h1>
      </div>

      {/* 收藏总数 */}
      {favLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="max-w-xs" data-ai-section-type="card-stat">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                收藏总数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground font-mono tabular-nums">
                {favoritesData?.total ?? 0}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                已收藏的题目
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 收藏列表 */}
      {favLoading ? (
        <FavoriteCardSkeleton />
      ) : isError ? (
        <Card className="p-6 text-center">
          <p className="text-destructive">加载失败，请稍后重试</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            重试
          </Button>
        </Card>
      ) : !favoritesData || favoritesData.items.length === 0 ? (
        <Empty className="border-solid">
          <EmptyMedia variant="icon">
            <BookmarkX className="size-6" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>暂无收藏</EmptyTitle>
            <EmptyDescription>
              刷题时点击收藏，好题随时回顾
            </EmptyDescription>
            <Button
              className="mt-2"
              onClick={() => navigate('/')}
            >
              去刷题
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="space-y-0" data-ai-section-type="card-list">
            {favoritesData.items.map((item: FavoriteListItem, idx: number) => (
              <Card
                key={item.id}
                className={cn(
                  'border-0 border-b border-border rounded-none shadow-none',
                  idx === 0 && 'border-t',
                )}
              >
                <CardContent className="py-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {item.paper.universityName}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.paper.year}年真题</span>
                    <span className="text-xs text-muted-foreground">第{item.question.questionNumber}题</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-auto',
                        QUESTION_TYPE_BADGE_VARIANT[
                          item.question.questionType as QuestionType
                        ] ?? 'bg-secondary text-secondary-foreground',
                      )}
                    >
                      {QUESTION_TYPE_LABELS[
                        item.question.questionType as QuestionType
                      ] ?? item.question.questionType}
                    </Badge>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground">
                    {truncateContent(item.question.content)}
                  </p>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/practice/${item.paper.id}?question=${item.question.id}`,
                        )
                      }
                    >
                      去练习
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        unfavoriteMutation.mutate(item.question.id)
                      }
                      disabled={unfavoriteMutation.isPending}
                    >
                      <BookmarkX className="size-4" strokeWidth={1.5} />
                      取消收藏
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      page === 1 && 'pointer-events-none opacity-50',
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={cn(
                      page === totalPages && 'pointer-events-none opacity-50',
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
