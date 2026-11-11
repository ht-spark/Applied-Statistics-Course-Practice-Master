import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Award, Lock, FileText } from 'lucide-react';
import { university, order } from '@client/src/api';
import { useAuth } from '@client/src/hooks/useAuth';
import type { ExamPaperSummary } from '@shared/api.interface';
import { Card } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';

type PaperWithCount = ExamPaperSummary & { questionCount: number };

function PaperCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-20 rounded-sm" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

function PaperCard({
  paper,
  locked,
}: {
  paper: PaperWithCount;
  locked: boolean;
}) {
  const navigate = useNavigate();

  const handleStart = () => {
    if (locked) return;
    navigate(`/practice/${paper.id}`);
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0 text-xs">
              {paper.year} 年
            </Badge>
            {paper.isPremium && (
              <Badge variant="outline" className="shrink-0 gap-1 text-xs text-primary border-primary/30">
                <Lock className="h-3 w-3" />
                付费
              </Badge>
            )}
          </div>
          <h3 className="mt-2 truncate font-heading text-base font-semibold text-foreground">
            {paper.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {paper.description}
          </p>
        </div>
        <Button
          variant={locked ? 'secondary' : 'default'}
          onClick={handleStart}
          disabled={locked}
          className="shrink-0"
        >
          {locked ? (
            <>
              <Lock className="h-4 w-4" />
              解锁后可做题
            </>
          ) : (
            '开始刷题'
          )}
        </Button>
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          <span className="font-mono tabular-nums">{paper.questionCount}</span>
          <span>题</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Award className="h-3 w-3" />
          <span className="font-mono tabular-nums">{paper.totalScore}</span>
          <span>分</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span className="font-mono tabular-nums">{paper.duration}</span>
          <span>分钟</span>
        </div>
      </div>
    </Card>
  );
}

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['university', id],
    queryFn: () => university.getUniversityDetail(id!),
    enabled: !!id,
  });

  const { data: unlockData } = useQuery({
    queryKey: ['university-unlocked', id],
    queryFn: () => order.checkUniversityUnlocked(id!),
    enabled: !!id && !!user,
  });

  const papers = data?.papers ?? [];
  const universityInfo = data?.university;

  // 已登录用户：按接口返回判断是否解锁；未登录用户：付费内容默认锁定
  const isUnlocked = user
    ? unlockData?.unlocked ?? false
    : false;

  // 按年份分组（倒序）
  const papersByYear = papers.reduce<Record<number, PaperWithCount[]>>(
    (acc, paper) => {
      const year = paper.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(paper);
      return acc;
    },
    {},
  );
  const years = Object.keys(papersByYear)
    .map(Number)
    .sort((a, b) => b - a);

  if (isLoading || !universityInfo) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-4 h-4 w-96" />
        <div className="space-y-6">
          {[0, 1].map((y) => (
            <div key={y}>
              <Skeleton className="mb-3 h-5 w-20" />
              <div className="space-y-3">
                <PaperCardSkeleton />
                <PaperCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => navigate('/universities')}
      >
        <ArrowLeft className="h-4 w-4" />
        返回院校列表
      </Button>

      <header className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">{universityInfo.name}</h1>
      </header>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {universityInfo.location}
              </span>
              <span className="text-border/70">/</span>
              <span>{universityInfo.shortName}</span>
            </div>
          </div>
          {universityInfo.isPremium && (
            <Badge variant="outline" className="shrink-0 text-primary border-primary/30">
              ¥{universityInfo.price}
            </Badge>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {universityInfo.description}
        </p>
        {universityInfo.isPremium && !isUnlocked && (
          <div className="mt-5 rounded-sm border border-border bg-secondary p-4">
            <p className="text-sm text-foreground flex items-start gap-2">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>该校真题包为付费内容，解锁后可查看全部套卷与答案解析。</span>
            </p>
            <Link
              to="/membership"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              去会员中心解锁
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {years.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            暂无套卷
          </div>
        ) : (
          years.map((year) => (
            <div key={year}>
              <h2 className="mb-3 font-heading text-base font-semibold text-foreground border-b border-border pb-2">
                <span className="text-primary mr-2">—</span>
                {year} 年
              </h2>
              <div className="space-y-3" data-ai-section-type="card-list">
                {papersByYear[year].map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    locked={paper.isPremium && !isUnlocked}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
