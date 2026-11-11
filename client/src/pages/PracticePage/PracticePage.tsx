import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Check,
  X,
  Clock,
  Award,
} from 'lucide-react';
import { university, question, study } from '@client/src/api';
import { useAuth } from '@client/src/hooks/useAuth';
import type {
  QuestionDetail,
  QuestionType,
  StudyRecord,
  SubmitAnswerResponse,
} from '@shared/api.interface';
import { QUESTION_TYPE_LABELS } from '@shared/api.interface';
import { Card } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Progress } from '@client/src/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Switch } from '@client/src/components/ui/switch';
import { Textarea } from '@client/src/components/ui/textarea';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Label } from '@client/src/components/ui/label';
import { renderMath } from './utils';

type QuestionLite = {
  id: string;
  paperId: string;
  questionType: string;
  questionNumber: number;
  content: string;
  score: number;
  difficulty: number;
  knowledgePoint: string;
  options: { id: string; questionId: string; optionKey: string; content: string }[];
};

type AnswerStatus = {
  userAnswer: string;
  submitted: boolean;
  result: SubmitAnswerResponse | null;
};

function QuestionNavSkeleton() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-7 rounded-sm" />
      ))}
    </div>
  );
}

function QuestionNav({
  questions,
  currentIndex,
  statusMap,
  onSelect,
}: {
  questions: QuestionLite[];
  currentIndex: number;
  statusMap: Record<string, AnswerStatus>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, i) => {
        const status = statusMap[q.id];
        const isCurrent = i === currentIndex;
        const isCorrect = status?.result?.isCorrect === true;
        const isWrong = status?.submitted && status.result?.isCorrect === false;
        const isAnswered = status?.submitted;

        let borderClass = 'border-border';
        let textClass = 'text-muted-foreground';
        let bgClass = 'bg-card';
        if (isCurrent) {
          borderClass = 'border-primary';
          textClass = 'text-primary';
          bgClass = 'bg-primary/5';
        } else if (isCorrect) {
          borderClass = 'border-success';
          textClass = 'text-success';
        } else if (isWrong) {
          borderClass = 'border-destructive';
          textClass = 'text-destructive';
        } else if (isAnswered) {
          textClass = 'text-foreground';
        }

        return (
          <button
            key={q.id}
            onClick={() => onSelect(i)}
            aria-label={`第 ${q.questionNumber} 题`}
            aria-current={isCurrent ? 'true' : undefined}
            className={`flex h-7 w-7 items-center justify-center rounded-sm border text-xs font-medium transition-colors ${borderClass} ${textClass} ${bgClass}`}
          >
            {q.questionNumber}
          </button>
        );
      })}
    </div>
  );
}

function QuestionContentSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </Card>
  );
}

export default function PracticePage() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMap, setAnswerMap] = useState<Record<string, AnswerStatus>>({});
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});

  // 单选 / 判断 答案
  const [singleAnswer, setSingleAnswer] = useState<string>('');
  // 多选答案
  const [multiAnswer, setMultiAnswer] = useState<string[]>([]);
  // 判断答案
  const [tfAnswer, setTfAnswer] = useState<boolean>(false);
  // 主观题答案
  const [subjectiveAnswer, setSubjectiveAnswer] = useState<string>('');

  const { data: paperData, isLoading: paperLoading } = useQuery({
    queryKey: ['paper-detail', paperId],
    queryFn: () => university.getPaperDetail(paperId!),
    enabled: !!paperId,
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['paper-records', paperId],
    queryFn: () => study.getPaperRecords(paperId!),
    enabled: !!paperId && !!user,
  });

  const questions = paperData?.questions ?? [];
  const paper = paperData?.paper;
  const currentQ: QuestionLite | undefined = questions[currentIndex];

  const currentSubmitted = !!currentQ?.id && !!answerMap[currentQ!.id]?.submitted;
  const { data: currentQuestionDetail } = useQuery({
    queryKey: ['question-detail', currentQ?.id],
    queryFn: () => question.getQuestion(currentQ!.id),
    enabled: !!currentQ?.id && currentSubmitted,
  });

  // 初始化答题记录
  useEffect(() => {
    if (!recordsData || !questions.length) return;
    const newMap: Record<string, AnswerStatus> = {};
    for (const rec of recordsData as StudyRecord[]) {
      newMap[rec.questionId] = {
        userAnswer: rec.userAnswer,
        submitted: true,
        result: rec.isCorrect !== null
          ? {
              isCorrect: rec.isCorrect,
              score: rec.score,
              correctAnswer: '',
              analysis: '',
              addedToWrong: false,
            }
          : null,
      };
    }
    setAnswerMap(newMap);
  }, [recordsData, questions]);

  // 切题时回填答案
  useEffect(() => {
    if (!currentQ) return;
    const status = answerMap[currentQ.id];
    if (status?.submitted) {
      if (currentQ.questionType === 'single_choice') {
        setSingleAnswer(status.userAnswer);
      } else if (currentQ.questionType === 'multiple_choice') {
        setMultiAnswer(status.userAnswer ? status.userAnswer.split(',') : []);
      } else if (currentQ.questionType === 'true_false') {
        setTfAnswer(status.userAnswer === 'true');
      } else {
        setSubjectiveAnswer(status.userAnswer);
      }
    } else {
      setSingleAnswer('');
      setMultiAnswer([]);
      setTfAnswer(false);
      setSubjectiveAnswer('');
    }
  }, [currentQ?.id, answerMap]);

  const submitMutation = useMutation({
    mutationFn: ({
      id,
      answer,
    }: {
      id: string;
      answer: string;
    }) => question.submitAnswer(id, answer),
    onSuccess: (data, variables) => {
      setAnswerMap((prev) => ({
        ...prev,
        [variables.id]: {
          userAnswer: variables.answer,
          submitted: true,
          result: data,
        },
      }));
      queryClient.invalidateQueries({ queryKey: ['paper-records', paperId] });
    },
    retry: false,
  });

  const favoriteMutation = useMutation({
    mutationFn: ({
      id,
      favorite,
    }: {
      id: string;
      favorite: boolean;
    }) => question.toggleFavorite(id, favorite),
    onSuccess: (data, variables) => {
      setFavoriteMap((prev) => ({
        ...prev,
        [variables.id]: data.favorited,
      }));
    },
    retry: false,
  });

  const handleSubmit = useCallback(() => {
    if (!currentQ) return;
    let answer = '';
    if (currentQ.questionType === 'single_choice') {
      answer = singleAnswer;
    } else if (currentQ.questionType === 'multiple_choice') {
      answer = multiAnswer.sort().join(',');
    } else if (currentQ.questionType === 'true_false') {
      answer = String(tfAnswer);
    } else {
      answer = subjectiveAnswer;
    }
    if (!answer.trim()) return;
    submitMutation.mutate({ id: currentQ.id, answer });
  }, [currentQ, singleAnswer, multiAnswer, tfAnswer, subjectiveAnswer, submitMutation]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentQ) return;
    const currentFav = favoriteMap[currentQ.id] ?? false;
    favoriteMutation.mutate({ id: currentQ.id, favorite: !currentFav });
  }, [currentQ, favoriteMap, favoriteMutation]);

  const answeredCount = useMemo(
    () => Object.values(answerMap).filter((s) => s.submitted).length,
    [answerMap],
  );
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };
  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentStatus = currentQ ? answerMap[currentQ.id] : undefined;
  const isSubmitted = currentStatus?.submitted;
  // 优先使用本次提交返回的结果；从记录恢复时用 question 详情补充 correctAnswer/analysis
  const submitResult: SubmitAnswerResponse | null = currentStatus?.result && currentStatus.result.correctAnswer
    ? currentStatus.result
    : currentStatus?.submitted && currentQuestionDetail
      ? {
          isCorrect: currentStatus.result?.isCorrect ?? null,
          score: currentStatus.result?.score ?? null,
          correctAnswer: currentQuestionDetail.correctAnswer,
          analysis: currentQuestionDetail.analysis,
          addedToWrong: false,
        }
      : currentStatus?.result ?? null;

  if (paperLoading || recordsLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10 md:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          返回
        </Button>
        <Skeleton className="mb-2 h-7 w-72" />
        <Skeleton className="mb-6 h-1 w-full" />
        <div className="mb-6">
          <QuestionNavSkeleton />
        </div>
        <QuestionContentSkeleton />
      </div>
    );
  }

  if (!paper || !currentQ) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center text-muted-foreground">
        套卷不存在或加载失败
      </div>
    );
  }

  const qType = currentQ.questionType as QuestionType;
  const isObjective = ['single_choice', 'multiple_choice', 'true_false'].includes(qType);
  const isCorrect = submitResult?.isCorrect === true;
  const isWrong = submitResult?.isCorrect === false;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10 md:py-12">
      {/* 顶部 */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        返回
      </Button>

      {/* 页面标题 */}
      <div className="section-title mb-8">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text truncate">{paper.title}</h1>
      </div>

      {/* 进度条 */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">答题进度</span>
          <span className="font-mono text-foreground">
            {answeredCount} / {totalCount}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左侧导航：桌面端 */}
        <div className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-6 rounded-sm border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-heading text-sm font-semibold text-foreground">
              题目导航
            </h3>
            <QuestionNav
              questions={questions}
              currentIndex={currentIndex}
              statusMap={answerMap}
              onSelect={setCurrentIndex}
            />
            <div className="mt-5 space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm border border-success" />
                <span>正确</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm border border-destructive" />
                <span>错误</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm border border-border" />
                <span>未答</span>
              </div>
            </div>
          </div>
        </div>

        {/* 移动端顶部导航 */}
        <div className="lg:hidden">
          <Card className="p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
              题目导航
            </h3>
            <div className="-mx-5 overflow-x-auto px-5 pb-1">
              <div className="flex gap-1.5">
                {questions.map((q, i) => {
                  const status = answerMap[q.id];
                  const isCurrent = i === currentIndex;
                  const isCorrectQ = status?.result?.isCorrect === true;
                  const isWrongQ =
                    status?.submitted && status.result?.isCorrect === false;

                  let borderClass = 'border-border';
                  let textClass = 'text-muted-foreground';
                  let bgClass = 'bg-card';
                  if (isCurrent) {
                    borderClass = 'border-primary';
                    textClass = 'text-primary';
                    bgClass = 'bg-primary/5';
                  } else if (isCorrectQ) {
                    borderClass = 'border-success';
                    textClass = 'text-success';
                  } else if (isWrongQ) {
                    borderClass = 'border-destructive';
                    textClass = 'text-destructive';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      aria-label={`第 ${q.questionNumber} 题`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-xs font-medium ${borderClass} ${textClass} ${bgClass}`}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* 主区域 */}
        <div className="flex-1 min-w-0">
          <Card className="p-8">
            {/* 题头 */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary text-primary">
                  第 {currentQ.questionNumber} 题
                </Badge>
                <Badge variant="outline">
                  {QUESTION_TYPE_LABELS[qType]}
                </Badge>
                {currentQ.knowledgePoint && (
                  <Badge variant="secondary">
                    {currentQ.knowledgePoint}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>{currentQ.score} 分</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                aria-label={favoriteMap[currentQ.id] ? '取消收藏' : '收藏'}
                disabled={favoriteMutation.isPending}
              >
                {favoriteMap[currentQ.id] ? (
                  <Star className="h-5 w-5 fill-primary text-primary" strokeWidth={1.5} />
                ) : (
                  <StarOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* 题目内容 */}
            <div
              className="mt-6 text-base leading-relaxed text-foreground [&_.katex-display]:my-4"
              dangerouslySetInnerHTML={{ __html: renderMath(currentQ.content) }}
            />

            {/* 作答区 */}
            <div className="mt-8">
              {qType === 'single_choice' && (
                <RadioGroup
                  value={singleAnswer}
                  onValueChange={setSingleAnswer}
                  disabled={isSubmitted}
                  className="space-y-3"
                >
                  {currentQ.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                        isSubmitted &&
                        submitResult?.correctAnswer === opt.optionKey
                          ? 'border-success bg-success/10'
                          : isSubmitted &&
                              singleAnswer === opt.optionKey &&
                              isWrong
                            ? 'border-destructive bg-destructive/10'
                            : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem
                        value={opt.optionKey}
                        id={`opt-${opt.id}`}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`opt-${opt.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <span className="mr-2 font-medium">
                          {opt.optionKey}.
                        </span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: renderMath(opt.content),
                          }}
                        />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {qType === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const checked = multiAnswer.includes(opt.optionKey);
                    const isCorrectOpt =
                      isSubmitted &&
                      submitResult?.correctAnswer
                        .split(',')
                        .includes(opt.optionKey);
                    const isWrongOpt =
                      isSubmitted && checked && !isCorrectOpt;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                          isCorrectOpt
                            ? 'border-success bg-success/10'
                            : isWrongOpt
                              ? 'border-destructive bg-destructive/10'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          id={`mopt-${opt.id}`}
                          checked={checked}
                          onCheckedChange={(checked) => {
                            if (isSubmitted) return;
                            if (checked) {
                              setMultiAnswer([
                                ...multiAnswer,
                                opt.optionKey,
                              ]);
                            } else {
                              setMultiAnswer(
                                multiAnswer.filter(
                                  (v) => v !== opt.optionKey,
                                ),
                              );
                            }
                          }}
                          disabled={isSubmitted}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`mopt-${opt.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="mr-2 font-medium">
                            {opt.optionKey}.
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderMath(opt.content),
                            }}
                          />
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {qType === 'true_false' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tfAnswer}
                      onCheckedChange={setTfAnswer}
                      disabled={isSubmitted}
                      id="tf-switch"
                    />
                    <Label htmlFor="tf-switch" className="text-sm">
                      {tfAnswer ? '正确' : '错误'}
                    </Label>
                  </div>
                </div>
              )}

              {(qType === 'calculation' || qType === 'short_answer') && (
                <div>
                  <Textarea
                    value={subjectiveAnswer}
                    onChange={(e) => setSubjectiveAnswer(e.target.value)}
                    placeholder="请输入你的答案..."
                    rows={6}
                    disabled={isSubmitted}
                  />
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            {!isSubmitted && (
              <div className="mt-8">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitMutation.isPending ||
                    (qType === 'single_choice' && !singleAnswer) ||
                    (qType === 'multiple_choice' && multiAnswer.length === 0) ||
                    ((qType === 'calculation' || qType === 'short_answer') &&
                      !subjectiveAnswer.trim())
                  }
                >
                  {submitMutation.isPending ? '提交中...' : '提交答案'}
                </Button>
              </div>
            )}

            {/* 结果区 */}
            {isSubmitted && submitResult && (
              <div className="mt-8 space-y-5 rounded-sm border border-border p-6">
                {isObjective ? (
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <>
                        <Badge
                          variant="outline"
                          className="border-success text-success"
                        >
                          <Check className="mr-1 h-3 w-3" strokeWidth={1.5} /> 回答正确
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          得分 <span className="font-mono text-foreground">{submitResult.score}</span>
                        </span>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-destructive text-destructive"
                      >
                        <X className="mr-1 h-3 w-3" strokeWidth={1.5} /> 回答错误
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" strokeWidth={1.5} /> 主观题
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      请对照参考答案自行评分
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <div className="mb-2 font-heading text-sm font-semibold text-foreground">
                    {isObjective ? '正确答案' : '参考答案'}
                  </div>
                  <div
                    className="text-sm text-foreground [&_.katex-display]:my-2"
                    dangerouslySetInnerHTML={{
                      __html: renderMath(submitResult.correctAnswer),
                    }}
                  />
                </div>

                {submitResult.analysis && (
                  <div className="border-t border-border pt-4">
                    <div className="mb-2 font-heading text-sm font-semibold text-foreground">
                      解析
                    </div>
                    <div
                      className="text-sm text-muted-foreground [&_.katex-display]:my-2"
                      dangerouslySetInnerHTML={{
                        __html: renderMath(submitResult.analysis),
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 底部导航 */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              上一题
            </Button>
            <span className="font-mono text-sm text-muted-foreground">
              {currentIndex + 1} / {totalCount}
            </span>
            <Button
              variant="outline"
              onClick={goNext}
              disabled={currentIndex === totalCount - 1}
            >
              下一题
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
