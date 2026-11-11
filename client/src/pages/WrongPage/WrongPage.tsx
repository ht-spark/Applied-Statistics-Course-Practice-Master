import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, CheckCircle2, Filter } from 'lucide-react';
import { question, university } from '@client/src/api';
import type { WrongQuestionListItem } from '@client/src/api/question';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@client/src/components/ui/empty';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
} from '@shared/api.interface';
import type { QuestionType } from '@shared/api.interface';

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

function WrongCardSkeleton() {
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
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-4 w-28" />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="p-5">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </Card>
      <Card className="p-5">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </Card>
    </div>
  );
}

export default function WrongPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const [universityId, setUniversityId] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('');

  const { data: universities, isLoading: univLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: () => university.getUniversities(),
    enabled: !!user,
  });

  const {
    data: wrongList,
    isLoading: wrongLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['wrongQuestions', universityId, questionType],
    queryFn: () =>
      question.getWrongQuestions({
        mastered: false,
        universityId: universityId || undefined,
        questionType: questionType || undefined,
      }),
    enabled: !!user,
  });

  const masteredMutation = useMutation({
    mutationFn: (questionId: string) =>
      question.markWrongMastered(questionId, true),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wrongQuestions'] });
      void queryClient.invalidateQueries({ queryKey: ['wrongStats'] });
    },
  });

  const stats = useMemo(() => {
    if (!wrongList) return { total: 0, mastered: 0 };
    const unmastered = wrongList.filter((w) => !w.mastered);
    return { total: unmastered.length, mastered: 0 };
  }, [wrongList]);

  const displayList = useMemo(() => {
    if (!wrongList) return [];
    return wrongList.filter((w) => !w.mastered);
  }, [wrongList]);

  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <StatsSkeleton />
        <WrongCardSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Empty className="max-w-md border-solid">
          <EmptyMedia variant="icon">
            <AlertCircle className="size-6" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>登录后查看错题本</EmptyTitle>
            <EmptyDescription>
              登录后即可记录错题，随时复盘巩固
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
        <h1 className="section-title__text">错题本</h1>
      </div>

      {/* 统计卡片 */}
      {wrongLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-ai-section-type="card-stat">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                错题总数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground font-mono tabular-nums">
                {stats.total}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                待巩固的错题
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                已掌握
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-success font-mono tabular-nums">
                {stats.mastered}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                已攻克的错题
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选区 */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="size-4" strokeWidth={1.5} />
            <span>筛选</span>
          </div>
          <Select
            value={universityId}
            onValueChange={setUniversityId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="全部院校" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部院校</SelectItem>
              {univLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SelectItem key={i} value={`loading-${i}`} disabled>
                      加载中...
                    </SelectItem>
                  ))
                : universities?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <Select
            value={questionType}
            onValueChange={setQuestionType}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部题型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部题型</SelectItem>
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 错题列表 */}
      {wrongLoading ? (
        <WrongCardSkeleton />
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
      ) : displayList.length === 0 ? (
        <Empty className="border-solid">
          <EmptyMedia variant="icon">
            <CheckCircle2 className="size-6" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>暂无错题</EmptyTitle>
            <EmptyDescription>
              去刷题吧，错题会自动收录到这里
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
        <div className="space-y-0" data-ai-section-type="card-list">
          {displayList.map((item: WrongQuestionListItem, idx: number) => (
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

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    错误次数
                    <span className="ml-1 font-mono font-medium text-destructive">
                      {item.wrongCount}
                    </span>
                  </span>
                  <span>
                    最近错误答案
                    <span className="ml-1 font-mono text-destructive">
                      {item.lastWrongAnswer || '-'}
                    </span>
                  </span>
                </div>

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
                      masteredMutation.mutate(item.question.id)
                    }
                    disabled={masteredMutation.isPending}
                  >
                    <CheckCircle2 className="size-4" strokeWidth={1.5} />
                    标记已掌握
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
