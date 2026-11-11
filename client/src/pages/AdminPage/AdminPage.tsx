import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CheckCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { admin } from '@client/src/api';
import { university as universityApi } from '@client/src/api';
import { order as orderApi } from '@client/src/api';
import { useAuth } from '@client/src/hooks/useAuth';
import type { University, ExamPaperSummary, Product, QuestionType, OrderStatus, PaymentMethod, PaymentQrCode } from '@shared/api.interface';
import { QUESTION_TYPE_LABELS, PRODUCT_TYPES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@shared/api.interface';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@client/src/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Button } from '@client/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Label } from '@client/src/components/ui/label';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Image } from '@client/src/components/ui/image';

// ========== 通用：表格骨架屏 ==========
function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ========== 表单字段组件 ==========
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ========== 院校管理 ==========
interface UniversityFormData {
  name: string;
  shortName: string;
  location: string;
  description: string;
  isPremium: boolean;
  price: number;
  sortOrder: number;
}

const defaultUniversityForm: UniversityFormData = {
  name: '',
  shortName: '',
  location: '',
  description: '',
  isPremium: false,
  price: 0,
  sortOrder: 0,
};

function UniversityPanel() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UniversityFormData>(defaultUniversityForm);

  const { data: universities, isLoading } = useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => universityApi.getUniversities(),
  });

  const createMut = useMutation({
    mutationFn: (d: UniversityFormData) => admin.createUniversity(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-universities'] });
      setDialogOpen(false);
      setForm(defaultUniversityForm);
    },
    retry: false,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UniversityFormData }) =>
      admin.updateUniversity(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-universities'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultUniversityForm);
    },
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.deleteUniversity(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-universities'] });
    },
    retry: false,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultUniversityForm);
    setDialogOpen(true);
  };

  const openEdit = (u: University & { sortOrder?: number }) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      shortName: u.shortName,
      location: u.location,
      description: u.description,
      isPremium: u.isPremium,
      price: Number(u.price),
      sortOrder: u.sortOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">院校列表</h3>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增院校
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <Table>
            <TableHeader className="border-b border-border">
              <TableRow>
                <TableHead className="font-normal text-muted-foreground">名称</TableHead>
                <TableHead className="font-normal text-muted-foreground">简称</TableHead>
                <TableHead className="font-normal text-muted-foreground">地点</TableHead>
                <TableHead className="font-normal text-muted-foreground">是否付费</TableHead>
                <TableHead className="font-normal text-muted-foreground">价格</TableHead>
                <TableHead className="font-normal text-muted-foreground">排序</TableHead>
                <TableHead className="text-right font-normal text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {universities?.map((u) => (
                <TableRow key={u.id} className="border-b border-border last:border-b-0">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.shortName}</TableCell>
                  <TableCell>{u.location}</TableCell>
                  <TableCell>
                    {u.isPremium ? (
                      <Badge variant="outline" className="border-primary text-primary">付费</Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">免费</Badge>
                    )}
                  </TableCell>
                  <TableCell>¥{u.price}</TableCell>
                  <TableCell>{(u as unknown as { sortOrder?: number }).sortOrder ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u as University & { sortOrder?: number })} aria-label="编辑">
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="删除">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除院校「{u.name}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMut.mutate(u.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑院校' : '新增院校'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="名称">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入院校名称"
                />
              </FormRow>
              <FormRow label="简称">
                <Input
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="请输入简称"
                />
              </FormRow>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="地点">
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="如：北京"
                />
              </FormRow>
              <FormRow label="排序">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </FormRow>
            </div>
            <FormRow label="描述">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="院校简介"
                rows={3}
              />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="价格（元）">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </FormRow>
              <div className="flex items-end">
                <SwitchRow
                  label="是否付费"
                  checked={form.isPremium}
                  onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending || !form.name || !form.shortName}
            >
              {createMut.isPending || updateMut.isPending ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== 套卷管理 ==========
interface PaperFormData {
  universityId: string;
  year: number;
  title: string;
  description: string;
  totalScore: number;
  duration: number;
  isPremium: boolean;
  sortOrder: number;
}

const defaultPaperForm: PaperFormData = {
  universityId: '',
  year: new Date().getFullYear(),
  title: '',
  description: '',
  totalScore: 150,
  duration: 180,
  isPremium: false,
  sortOrder: 0,
};

function PaperPanel() {
  const queryClient = useQueryClient();
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaperFormData>(defaultPaperForm);

  const { data: universities } = useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => universityApi.getUniversities(),
  });

  const { data: detail, isLoading: papersLoading } = useQuery({
    queryKey: ['admin-papers', selectedUniversityId],
    queryFn: () => universityApi.getUniversityDetail(selectedUniversityId),
    enabled: !!selectedUniversityId,
  });

  const papers = detail?.papers ?? [];

  const createMut = useMutation({
    mutationFn: (d: PaperFormData) => admin.createPaper(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-papers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-universities'] });
      setDialogOpen(false);
      setForm(defaultPaperForm);
    },
    retry: false,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaperFormData> }) =>
      admin.updatePaper(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-papers'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultPaperForm);
    },
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.deletePaper(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-papers'] });
    },
    retry: false,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultPaperForm, universityId: selectedUniversityId });
    setDialogOpen(true);
  };

  const openEdit = (p: ExamPaperSummary & { sortOrder?: number }) => {
    setEditingId(p.id);
    setForm({
      universityId: p.universityId,
      year: p.year,
      title: p.title,
      description: p.description,
      totalScore: p.totalScore,
      duration: p.duration,
      isPremium: p.isPremium,
      sortOrder: p.sortOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">选择院校：</Label>
          <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="请选择院校" />
            </SelectTrigger>
            <SelectContent>
              {universities?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} disabled={!selectedUniversityId}>
          <Plus className="size-4" strokeWidth={1.5} />
          新增套卷
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {!selectedUniversityId ? (
          <div className="p-8 text-center text-muted-foreground">请先选择院校</div>
        ) : papersLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <Table>
            <TableHeader className="border-b border-border">
              <TableRow>
                <TableHead className="font-normal text-muted-foreground">年份</TableHead>
                <TableHead className="font-normal text-muted-foreground">标题</TableHead>
                <TableHead className="font-normal text-muted-foreground">总分</TableHead>
                <TableHead className="font-normal text-muted-foreground">时长（分钟）</TableHead>
                <TableHead className="font-normal text-muted-foreground">是否付费</TableHead>
                <TableHead className="font-normal text-muted-foreground">排序</TableHead>
                <TableHead className="text-right font-normal text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((p) => (
                <TableRow key={p.id} className="border-b border-border last:border-b-0">
                  <TableCell>{p.year}</TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.totalScore}</TableCell>
                  <TableCell>{p.duration}</TableCell>
                  <TableCell>
                    {p.isPremium ? (
                      <Badge variant="outline" className="border-primary text-primary">付费</Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">免费</Badge>
                    )}
                  </TableCell>
                  <TableCell>{(p as unknown as { sortOrder?: number }).sortOrder ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p as ExamPaperSummary & { sortOrder?: number })}
                        aria-label="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="删除">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除套卷「{p.title}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMut.mutate(p.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {papers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                    暂无套卷
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑套卷' : '新增套卷'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <FormRow label="所属院校">
              <Select
                value={form.universityId}
                onValueChange={(v) => setForm({ ...form, universityId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择院校" />
                </SelectTrigger>
                <SelectContent>
                  {universities?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="年份">
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </FormRow>
              <FormRow label="排序">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </FormRow>
            </div>
            <FormRow label="标题">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="如：432统计学真题"
              />
            </FormRow>
            <FormRow label="描述">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="总分">
                <Input
                  type="number"
                  value={form.totalScore}
                  onChange={(e) => setForm({ ...form, totalScore: Number(e.target.value) })}
                />
              </FormRow>
              <FormRow label="时长（分钟）">
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                />
              </FormRow>
            </div>
            <SwitchRow
              label="是否付费"
              checked={form.isPremium}
              onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMut.isPending ||
                updateMut.isPending ||
                !form.universityId ||
                !form.title
              }
            >
              {createMut.isPending || updateMut.isPending ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== 题目管理 ==========
interface QuestionOptionForm {
  optionKey: string;
  content: string;
}

interface QuestionFormData {
  paperId: string;
  questionType: string;
  questionNumber: number;
  content: string;
  correctAnswer: string;
  analysis: string;
  score: number;
  difficulty: number;
  knowledgePoint: string;
  options: QuestionOptionForm[];
}

interface QuestionRow {
  id: string;
  paperId: string;
  questionType: string;
  questionNumber: number;
  content: string;
  correctAnswer: string;
  analysis: string;
  score: number;
  difficulty: number;
  knowledgePoint: string;
  options: QuestionOptionForm[];
}

const defaultQuestionForm: QuestionFormData = {
  paperId: '',
  questionType: 'single_choice',
  questionNumber: 1,
  content: '',
  correctAnswer: '',
  analysis: '',
  score: 5,
  difficulty: 1,
  knowledgePoint: '',
  options: [
    { optionKey: 'A', content: '' },
    { optionKey: 'B', content: '' },
    { optionKey: 'C', content: '' },
    { optionKey: 'D', content: '' },
  ],
};

const OBJECTIVE_TYPES = ['single_choice', 'multiple_choice', 'true_false'];

function QuestionPanel() {
  const queryClient = useQueryClient();
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormData>(defaultQuestionForm);

  const { data: universities } = useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => universityApi.getUniversities(),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-papers', selectedUniversityId],
    queryFn: () => universityApi.getUniversityDetail(selectedUniversityId),
    enabled: !!selectedUniversityId,
  });

  const papers = detail?.papers ?? [];

  const { data: paperDetail, isLoading: questionsLoading } = useQuery({
    queryKey: ['admin-questions', selectedPaperId],
    queryFn: () => universityApi.getPaperDetail(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  const questions = useMemo(
    () => (paperDetail?.questions ?? []) as unknown as QuestionRow[],
    [paperDetail],
  );

  const createMut = useMutation({
    mutationFn: (d: QuestionFormData) => admin.createQuestion(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      setDialogOpen(false);
      setForm(defaultQuestionForm);
    },
    retry: false,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuestionFormData> }) =>
      admin.updateQuestion(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultQuestionForm);
    },
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.deleteQuestion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    retry: false,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...defaultQuestionForm,
      paperId: selectedPaperId,
      questionNumber: (questions.length || 0) + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (q: QuestionRow) => {
    setEditingId(q.id);
    setForm({
      paperId: q.paperId,
      questionType: q.questionType,
      questionNumber: q.questionNumber,
      content: q.content,
      correctAnswer: q.correctAnswer,
      analysis: q.analysis,
      score: q.score,
      difficulty: q.difficulty,
      knowledgePoint: q.knowledgePoint,
      options: q.options?.length ? q.options.map((o) => ({ optionKey: o.optionKey, content: o.content })) : [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const isObjective = OBJECTIVE_TYPES.includes(form.questionType);

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + form.options.length); // A, B, C...
    setForm({ ...form, options: [...form.options, { optionKey: nextKey, content: '' }] });
  };

  const removeOption = (index: number) => {
    const newOptions = form.options.filter((_, i) => i !== index);
    // 重新编号 optionKey
    const renumbered = newOptions.map((o, i) => ({
      ...o,
      optionKey: String.fromCharCode(65 + i),
    }));
    setForm({ ...form, options: renumbered });
  };

  const updateOption = (index: number, content: string) => {
    const newOptions = [...form.options];
    newOptions[index] = { ...newOptions[index], content };
    setForm({ ...form, options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">院校：</Label>
            <Select value={selectedUniversityId} onValueChange={(v) => {
              setSelectedUniversityId(v);
              setSelectedPaperId('');
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="请选择院校" />
              </SelectTrigger>
              <SelectContent>
                {universities?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">套卷：</Label>
            <Select
              value={selectedPaperId}
              onValueChange={setSelectedPaperId}
              disabled={!selectedUniversityId}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="请选择套卷" />
              </SelectTrigger>
              <SelectContent>
                {papers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.year} - {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={openCreate} disabled={!selectedPaperId}>
          <Plus className="size-4" strokeWidth={1.5} />
          新增题目
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {!selectedPaperId ? (
          <div className="p-8 text-center text-muted-foreground">请先选择院校和套卷</div>
        ) : questionsLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <Table>
            <TableHeader className="border-b border-border">
              <TableRow>
                <TableHead className="w-16 font-normal text-muted-foreground">题号</TableHead>
                <TableHead className="w-24 font-normal text-muted-foreground">题型</TableHead>
                <TableHead className="font-normal text-muted-foreground">内容</TableHead>
                <TableHead className="w-20 font-normal text-muted-foreground">分值</TableHead>
                <TableHead className="w-32 font-normal text-muted-foreground">知识点</TableHead>
                <TableHead className="text-right w-28 font-normal text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id} className="border-b border-border last:border-b-0">
                  <TableCell className="font-mono tabular-nums">{q.questionNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
                      {QUESTION_TYPE_LABELS[q.questionType as QuestionType] ?? q.questionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate">{q.content}</div>
                  </TableCell>
                  <TableCell>{q.score}</TableCell>
                  <TableCell>{q.knowledgePoint || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(q)}
                        aria-label="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="删除">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除第 {q.questionNumber} 题吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMut.mutate(q.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                    暂无题目
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑题目' : '新增题目'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="所属套卷">
                <Select
                  value={form.paperId}
                  onValueChange={(v) => setForm({ ...form, paperId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择套卷" />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.year} - {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="题型">
                <Select
                  value={form.questionType}
                  onValueChange={(v) => {
                    setForm({ ...form, questionType: v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormRow label="题号">
                <Input
                  type="number"
                  value={form.questionNumber}
                  onChange={(e) =>
                    setForm({ ...form, questionNumber: Number(e.target.value) })
                  }
                />
              </FormRow>
              <FormRow label="分值">
                <Input
                  type="number"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                />
              </FormRow>
              <FormRow label="难度（1-5）">
                <Input
                  type="number"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: Number(e.target.value) })
                  }
                />
              </FormRow>
            </div>
            <FormRow label="知识点">
              <Input
                value={form.knowledgePoint}
                onChange={(e) => setForm({ ...form, knowledgePoint: e.target.value })}
                placeholder="如：参数估计、假设检验"
              />
            </FormRow>
            <FormRow label="题目内容">
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="请输入题目内容"
              />
            </FormRow>
            <FormRow label="正确答案">
              <Input
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder={
                  isObjective ? '如：A / AB / 正确' : '主观题参考答案要点'
                }
              />
            </FormRow>
            <FormRow label="解析">
              <Textarea
                value={form.analysis}
                onChange={(e) => setForm({ ...form, analysis: e.target.value })}
                rows={3}
                placeholder="题目解析"
              />
            </FormRow>

            {isObjective && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">选项</Label>
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="size-3" />
                    添加选项
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-8 text-center font-mono text-sm font-medium text-muted-foreground">
                        {opt.optionKey}
                      </div>
                      <Input
                        value={opt.content}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`选项 ${opt.optionKey} 内容`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx)}
                        disabled={form.options.length <= 2}
                        aria-label="删除选项"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMut.isPending ||
                updateMut.isPending ||
                !form.paperId ||
                !form.content
              }
            >
              {createMut.isPending || updateMut.isPending ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== 商品管理 ==========
interface ProductFormData {
  name: string;
  description: string;
  productType: string;
  targetId: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
}

const defaultProductForm: ProductFormData = {
  name: '',
  description: '',
  productType: 'vip',
  targetId: '',
  price: 0,
  originalPrice: 0,
  durationDays: 365,
  isActive: true,
  sortOrder: 0,
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  vip: 'VIP 会员',
  university_bundle: '院校真题包',
  paper_bundle: '单套卷',
};

function ProductPanel() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultProductForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => orderApi.getProducts(),
  });

  const createMut = useMutation({
    mutationFn: (d: ProductFormData) => admin.createProduct(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      setForm(defaultProductForm);
    },
    retry: false,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      admin.updateProduct(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultProductForm);
    },
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    retry: false,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultProductForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Product & { sortOrder?: number }) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      productType: p.productType,
      targetId: p.targetId,
      price: Number(p.price),
      originalPrice: Number(p.originalPrice),
      durationDays: p.durationDays,
      isActive: p.isActive,
      sortOrder: p.sortOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">商品列表</h3>
        <Button onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.5} />
          新增商品
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : (
          <Table>
            <TableHeader className="border-b border-border">
              <TableRow>
                <TableHead className="font-normal text-muted-foreground">名称</TableHead>
                <TableHead className="font-normal text-muted-foreground">类型</TableHead>
                <TableHead className="font-normal text-muted-foreground">价格</TableHead>
                <TableHead className="font-normal text-muted-foreground">原价</TableHead>
                <TableHead className="font-normal text-muted-foreground">时长（天）</TableHead>
                <TableHead className="font-normal text-muted-foreground">状态</TableHead>
                <TableHead className="font-normal text-muted-foreground">排序</TableHead>
                <TableHead className="text-right font-normal text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((p) => (
                <TableRow key={p.id} className="border-b border-border last:border-b-0">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[p.productType] ?? p.productType}
                    </Badge>
                  </TableCell>
                  <TableCell>¥{p.price}</TableCell>
                  <TableCell className="text-muted-foreground line-through">¥{p.originalPrice}</TableCell>
                  <TableCell>{p.durationDays}</TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge variant="outline" className="border-success text-success">上架</Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">下架</Badge>
                    )}
                  </TableCell>
                  <TableCell>{(p as unknown as { sortOrder?: number }).sortOrder ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p as Product & { sortOrder?: number })}
                        aria-label="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="删除">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除商品「{p.name}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMut.mutate(p.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8 text-center text-muted-foreground">
                    暂无商品
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑商品' : '新增商品'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <FormRow label="商品名称">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入商品名称"
              />
            </FormRow>
            <FormRow label="描述">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="商品类型">
                <Select
                  value={form.productType}
                  onValueChange={(v) => setForm({ ...form, productType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PRODUCT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="目标 ID">
                <Input
                  value={form.targetId}
                  onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                  placeholder="关联的院校/套卷 ID"
                />
              </FormRow>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormRow label="价格（元）">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </FormRow>
              <FormRow label="原价（元）">
                <Input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm({ ...form, originalPrice: Number(e.target.value) })
                  }
                />
              </FormRow>
              <FormRow label="时长（天）">
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm({ ...form, durationDays: Number(e.target.value) })
                  }
                />
              </FormRow>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="排序">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </FormRow>
              <div className="flex items-end">
                <SwitchRow
                  label="上架状态"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending || !form.name}
            >
              {createMut.isPending || updateMut.isPending ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== 收款码配置 ==========
function QrCodePanel() {
  const queryClient = useQueryClient();
  const [wechatUrl, setWechatUrl] = useState('');
  const [alipayUrl, setAlipayUrl] = useState('');

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ['admin-qr-codes'],
    queryFn: () => admin.getQrCodes(),
  });

  useEffect(() => {
    if (qrCodes) {
      const wechat = qrCodes.find((q: PaymentQrCode) => q.payMethod === 'wechat');
      const alipay = qrCodes.find((q: PaymentQrCode) => q.payMethod === 'alipay');
      if (wechat) setWechatUrl(wechat.imageUrl);
      if (alipay) setAlipayUrl(alipay.imageUrl);
    }
  }, [qrCodes]);

  const updateMut = useMutation({
    mutationFn: ({ payMethod, imageUrl }: { payMethod: string; imageUrl: string }) =>
      admin.updateQrCode(payMethod, imageUrl),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-qr-codes'] });
      toast.success(`${PAYMENT_METHOD_LABELS[variables.payMethod as PaymentMethod] ?? variables.payMethod}收款码已更新`);
    },
    onError: () => {
      toast.error('保存失败，请重试');
    },
    retry: false,
  });

  const handleSave = (payMethod: 'wechat' | 'alipay') => {
    const imageUrl = payMethod === 'wechat' ? wechatUrl : alipayUrl;
    updateMut.mutate({ payMethod, imageUrl });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: Array<{ key: 'wechat' | 'alipay'; title: string; value: string; onChange: (v: string) => void }> = [
    { key: 'wechat', title: '微信收款码', value: wechatUrl, onChange: setWechatUrl },
    { key: 'alipay', title: '支付宝收款码', value: alipayUrl, onChange: setAlipayUrl },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" strokeWidth={1.5} />
              <h3 className="font-heading text-base font-semibold text-foreground">{card.title}</h3>
            </div>
            <div className="flex h-48 items-center justify-center rounded-sm border border-dashed border-border bg-secondary">
              {card.value ? (
                <Image
                  src={card.value}
                  alt={card.title}
                  className="max-h-48 max-w-[200px] object-contain"
                />
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  <QrCode className="mx-auto mb-2 size-8 text-muted-foreground" strokeWidth={1.5} />
                  <div>未上传</div>
                </div>
              )}
            </div>
          <FormRow label="图片 URL">
            <Input
              value={card.value}
              onChange={(e) => card.onChange(e.target.value)}
              placeholder="请输入收款码图片链接"
            />
          </FormRow>
          <Button
            onClick={() => handleSave(card.key)}
            disabled={updateMut.isPending}
          >
            {updateMut.isPending ? '保存中...' : '保存'}
          </Button>
        </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== 订单管理 ==========
function OrderAdminPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, pageSize, status],
    queryFn: () =>
      admin.getAdminOrders({
        page,
        pageSize,
        status: status === 'all' ? undefined : status,
      }),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => admin.confirmOrderPaid(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('订单已确认支付');
      setConfirmingId(null);
    },
    onError: () => {
      toast.error('确认失败，请重试');
    },
    retry: false,
  });

  const handleStatusChange = (value: string) => {
    setStatus(value as OrderStatus | 'all');
    setPage(1);
  };

  const getStatusBadgeClass = (s: OrderStatus): string => {
    if (s === 'pending_confirmation') {
      return 'border-primary text-primary bg-primary/5';
    }
    if (s === 'paid') {
      return 'border-success text-success bg-success/5';
    }
    return 'border-border bg-secondary text-muted-foreground';
  };

  const getStatusVariant = (s: OrderStatus): 'outline' | 'secondary' => {
    if (s === 'pending_confirmation' || s === 'paid') return 'outline';
    return 'outline';
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">订单列表</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态：</span>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待支付</SelectItem>
              <SelectItem value="pending_confirmation">待确认</SelectItem>
              <SelectItem value="paid">已支付</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <>
            <Table>
              <TableHeader className="border-b border-border">
                <TableRow>
                  <TableHead className="font-normal text-muted-foreground">订单号</TableHead>
                  <TableHead className="font-normal text-muted-foreground">商品名称</TableHead>
                  <TableHead className="font-normal text-muted-foreground">金额</TableHead>
                  <TableHead className="font-normal text-muted-foreground">支付方式</TableHead>
                  <TableHead className="font-normal text-muted-foreground">状态</TableHead>
                  <TableHead className="font-normal text-muted-foreground">创建时间</TableHead>
                  <TableHead className="text-right font-normal text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      暂无订单数据
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items?.map((order) => {
                    const orderStatus = order.status as OrderStatus;
                    return (
                      <TableRow key={order.id} className="border-b border-border last:border-b-0">
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs border-border bg-secondary text-muted-foreground">
                            {order.id.slice(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{order.productName}</TableCell>
                        <TableCell className="font-mono tabular-nums">¥{order.amount}</TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ??
                            order.paymentMethod}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(orderStatus)}
                            className={getStatusBadgeClass(orderStatus)}
                          >
                            {ORDER_STATUS_LABELS[orderStatus] ?? order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {orderStatus === 'pending_confirmation' && (
                            <AlertDialog
                              open={confirmingId === order.id}
                              onOpenChange={(open) => {
                                if (!open) setConfirmingId(null);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setConfirmingId(order.id)}
                                >
                                  <CheckCircle className="mr-1 size-4" />
                                  确认已支付
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认订单已支付</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确认订单 <span className="font-mono">{order.id.slice(0, 8)}...</span> 已收到款项？确认后订单状态将变为已支付。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => confirmMut.mutate(order.id)}
                                    disabled={confirmMut.isPending}
                                  >
                                    {confirmMut.isPending ? '确认中...' : '确认已支付'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {data && data.total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  共 {data.total} 条，第 {page} / {totalPages} 页
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ========== 主页面 ==========
export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="px-4 py-8 md:px-10 md:py-12">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-destructive">403</div>
          <div className="mt-2 text-lg font-medium text-foreground">您没有管理员权限</div>
          <div className="mt-1 text-sm text-muted-foreground">
            如需访问后台管理，请联系系统管理员开通权限。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-10 md:py-12">
      <div className="section-title mb-8">
        <span className="section-title__num">01</span>
        <h1 className="section-title__text">后台管理</h1>
      </div>
      <p className="-mt-6 text-sm text-muted-foreground">
        管理院校、套卷、题目和商品数据
      </p>

      <Tabs defaultValue="universities" className="w-full">
        <TabsList className="mb-6 bg-transparent p-0 border-b border-border h-auto w-full justify-start gap-6 rounded-none">
          <TabsTrigger value="universities" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">院校管理</TabsTrigger>
          <TabsTrigger value="papers" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">套卷管理</TabsTrigger>
          <TabsTrigger value="questions" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">题目管理</TabsTrigger>
          <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">商品管理</TabsTrigger>
          <TabsTrigger value="qr-codes" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">收款码配置</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">订单管理</TabsTrigger>
        </TabsList>
        <TabsContent value="universities">
          <UniversityPanel />
        </TabsContent>
        <TabsContent value="papers">
          <PaperPanel />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionPanel />
        </TabsContent>
        <TabsContent value="products">
          <ProductPanel />
        </TabsContent>
        <TabsContent value="qr-codes">
          <QrCodePanel />
        </TabsContent>
        <TabsContent value="orders">
          <OrderAdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
