import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@client/src/hooks/useAuth';
import { university as universityApi } from '@client/src/api';
import { study as studyApi } from '@client/src/api';
import type { University } from '@shared/api.interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  BookOpen,
  BookMarked,
  Star,
  GraduationCap,
  MapPin,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-sm" />
      ))}
    </div>
  );
}

function UniversitiesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-sm" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3 w-3 mr-1" />
        重试
      </Button>
    </div>
  );
}

function UniversityCard({ university }: { university: University }) {
  const navigate = useNavigate();
  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => navigate(`/universities/${university.id}`)}
      role="link"
      aria-label={`查看 ${university.name} 详情`}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-foreground leading-tight text-base">
              {university.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{university.shortName}</p>
          </div>
          {university.isPremium && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              付费
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {university.location}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="font-mono tabular-nums">{university.paperCount}</span>
            <span>套真题</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  const {
    data: universities,
    isLoading: universitiesLoading,
    isError: universitiesError,
    refetch: refetchUniversities,
  } = useQuery({
    queryKey: ['universities'],
    queryFn: () => universityApi.getUniversities(),
  });

  const {
    data: studyStats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['study-stats'],
    queryFn: () => studyApi.getStudyStats(),
    enabled: !!user,
  });

  return (
    <div className="space-y-10">
      {/* 页面标题 */}
      <header className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">
          {user ? `你好，${user.nickname}` : '欢迎来到 432 应统刷题'}
        </h1>
      </header>

      {/* 学习概览 */}
      <section className="space-y-4">
        {user ? (
          <>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              学习概览
            </h2>
            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <StatsSkeleton />
                ) : statsError ? (
                  <ErrorState message="学习数据加载失败" onRetry={refetchStats} />
                ) : studyStats ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-sm border border-border p-5 text-center bg-card">
                      <div className="text-3xl font-heading font-semibold text-foreground font-mono tabular-nums">
                        {studyStats.answeredCount}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">已答题数</div>
                    </div>
                    <div className="rounded-sm border border-border p-5 text-center bg-card">
                      <div className="text-3xl font-heading font-semibold text-foreground font-mono tabular-nums">
                        {studyStats.correctCount}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">正确数</div>
                    </div>
                    <div className="rounded-sm border border-border p-5 text-center bg-card">
                      <div className="text-3xl font-heading font-semibold text-primary font-mono tabular-nums">
                        {studyStats.answeredCount > 0
                          ? `${Math.round(studyStats.accuracy * 100)}%`
                          : '0%'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">正确率</div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-sm bg-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-base">
                    登录后记录你的学习进度
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    错题本、收藏、学习记录，一站全搞定
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/login">立即登录</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 快捷入口 */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">快捷入口</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-ai-section-type="card-menu">
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-heading font-semibold text-foreground text-base">开始刷题</h3>
                <p className="text-xs text-muted-foreground mt-0.5">浏览院校真题，开始练习</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <BookMarked className="h-5 w-5 text-foreground flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-heading font-semibold text-foreground text-base">错题本</h3>
                <p className="text-xs text-muted-foreground mt-0.5">回顾错题，巩固薄弱点</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <Star className="h-5 w-5 text-foreground flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-heading font-semibold text-foreground text-base">收藏</h3>
                <p className="text-xs text-muted-foreground mt-0.5">收藏好题，随时温习</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 推荐院校 */}
      <section className="space-y-4" data-ai-section-type="card-list">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">推荐院校</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/universities">查看全部</Link>
          </Button>
        </div>

        {universitiesLoading ? (
          <UniversitiesSkeleton />
        ) : universitiesError ? (
          <Card>
            <CardContent className="py-6">
              <ErrorState message="院校列表加载失败" onRetry={refetchUniversities} />
            </CardContent>
          </Card>
        ) : universities && universities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {universities.slice(0, 4).map((u: University) => (
              <UniversityCard key={u.id} university={u} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              暂无院校数据
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
