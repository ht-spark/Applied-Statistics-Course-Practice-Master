import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, BookOpen } from 'lucide-react';
import { university } from '@client/src/api';
import type { University } from '@shared/api.interface';
import { Card } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';

function UniversityCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-5 w-12 rounded-sm" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

function UniversityCard({ item }: { item: University }) {
  return (
    <Link to={`/universities/${item.id}`} className="block">
      <Card className="h-full p-5 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-semibold text-foreground">
              {item.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.location}</span>
              <span className="shrink-0 text-border/70">/</span>
              <span className="shrink-0">{item.shortName}</span>
            </div>
          </div>
          {item.isPremium ? (
            <Badge variant="outline" className="shrink-0 text-primary border-primary/30">
              ¥{item.price}
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              免费
            </Badge>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span className="font-mono tabular-nums">{item.paperCount}</span>
            <span>套真题</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function UniversityListPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['universities', keyword],
    queryFn: () => university.getUniversities(keyword || undefined),
  });

  const filtered = useMemo(() => data ?? [], [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="section-title">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">院校题库</h1>
      </header>

      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        选择目标院校，开始刷 432 应用统计真题
      </p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索院校名称..."
            className="pl-10"
          />
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <UniversityCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>暂无匹配的院校</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          data-ai-section-type="card-list"
        >
          {filtered.map((item: University) => (
            <UniversityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
