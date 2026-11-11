import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { StudyStats, StudyRecord } from '@shared/api.interface';

export interface WrongStatsResponse {
  totalWrong: number;
  masteredCount: number;
  byUniversity: {
    universityId: string;
    universityName: string;
    count: number;
  }[];
}

export async function getStudyStats(): Promise<StudyStats> {
  const res = await axiosForBackend.get('/api/study/stats');
  return res.data;
}

export async function getPaperRecords(paperId: string): Promise<StudyRecord[]> {
  const res = await axiosForBackend.get(`/api/study/paper/${paperId}`);
  return res.data;
}

export async function getWrongStats(): Promise<WrongStatsResponse> {
  const res = await axiosForBackend.get('/api/study/wrong-stats');
  return res.data;
}
