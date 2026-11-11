import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  QuestionDetail,
  SubmitAnswerResponse,
  WrongQuestion,
  Favorite,
} from '@shared/api.interface';

export interface WrongQuestionListItem extends WrongQuestion {
  question: {
    id: string;
    questionType: string;
    questionNumber: number;
    content: string;
    score: number;
    knowledgePoint: string;
  };
  paper: {
    id: string;
    title: string;
    year: number;
    universityId: string;
    universityName: string;
  };
}

export interface FavoriteListItem extends Favorite {
  question: {
    id: string;
    questionType: string;
    questionNumber: number;
    content: string;
    score: number;
    knowledgePoint: string;
  };
  paper: {
    id: string;
    title: string;
    year: number;
    universityId: string;
    universityName: string;
  };
}

export async function getQuestion(id: string): Promise<QuestionDetail> {
  const res = await axiosForBackend.get(`/api/questions/${id}`);
  return res.data;
}

export async function submitAnswer(
  id: string,
  userAnswer: string,
): Promise<SubmitAnswerResponse> {
  const res = await axiosForBackend.post(`/api/questions/${id}/submit`, { userAnswer });
  return res.data;
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<{ favorited: boolean }> {
  const res = await axiosForBackend.post(`/api/questions/${id}/favorite`, { favorite });
  return res.data;
}

export async function getFavorites(page = 1, pageSize = 20): Promise<{
  items: FavoriteListItem[];
  total: number;
}> {
  const res = await axiosForBackend.get('/api/favorites', { params: { page, pageSize } });
  return res.data;
}

export async function getWrongQuestions(params?: {
  universityId?: string;
  questionType?: string;
  mastered?: boolean;
}): Promise<WrongQuestionListItem[]> {
  const res = await axiosForBackend.get('/api/wrong-questions', { params });
  return res.data;
}

export async function markWrongMastered(
  questionId: string,
  mastered: boolean,
): Promise<void> {
  await axiosForBackend.patch(`/api/wrong-questions/${questionId}/master`, { mastered });
}
