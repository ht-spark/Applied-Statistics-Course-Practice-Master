import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { University, ExamPaperSummary, QuestionDetail, QuestionOption } from '@shared/api.interface';

export interface UniversityListResponse {
  items: University[];
}

export interface UniversityDetailResponse {
  university: University;
  papers: (ExamPaperSummary & { questionCount: number })[];
}

export interface PaperDetailResponse {
  paper: ExamPaperSummary;
  questions: {
    id: string;
    paperId: string;
    questionType: string;
    questionNumber: number;
    content: string;
    score: number;
    difficulty: number;
    knowledgePoint: string;
    options: QuestionOption[];
  }[];
}

export async function getUniversities(keyword?: string): Promise<University[]> {
  const res = await axiosForBackend.get('/api/universities', { params: { keyword } });
  return res.data;
}

export async function getUniversityDetail(id: string): Promise<UniversityDetailResponse> {
  const res = await axiosForBackend.get(`/api/universities/${id}`);
  return res.data;
}

export async function getPaperDetail(id: string): Promise<PaperDetailResponse> {
  const res = await axiosForBackend.get(`/api/papers/${id}`);
  return res.data;
}
