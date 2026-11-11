import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, sql, count, and } from 'drizzle-orm';
import {
  studyRecords,
  wrongQuestions,
  questions,
  examPapers,
  universities,
} from '@server/database/schema';
import type { StudyStats, StudyRecord } from '@shared/api.interface';

export interface WrongStatsResult {
  totalWrong: number;
  masteredCount: number;
  byUniversity: { universityId: string; universityName: string; count: number }[];
}

@Injectable()
export class StudyService {
  private readonly logger = new Logger(StudyService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStats(userId: string): Promise<StudyStats> {
    const totalResult = await this.db
      .select({ value: count() })
      .from(questions);
    const totalQuestions = Number(totalResult[0]?.value ?? 0);

    const records = await this.db
      .select({
        isCorrect: studyRecords.isCorrect,
      })
      .from(studyRecords)
      .where(eq(studyRecords.userId, userId));

    const answeredCount = records.length;
    const correctCount = records.filter((r: { isCorrect: boolean | null }) => r.isCorrect === true).length;
    const wrongCount = records.filter((r: { isCorrect: boolean | null }) => r.isCorrect === false).length;
    const accuracy = answeredCount > 0 ? correctCount / answeredCount : 0;

    return {
      totalQuestions,
      answeredCount,
      correctCount,
      wrongCount,
      accuracy,
    };
  }

  async getPaperRecords(userId: string, paperId: string): Promise<StudyRecord[]> {
    const records = await this.db
      .select({
        questionId: studyRecords.questionId,
        userAnswer: studyRecords.userAnswer,
        isCorrect: studyRecords.isCorrect,
        score: studyRecords.score,
        updatedAt: studyRecords.updatedAt,
      })
      .from(studyRecords)
      .where(
        and(
          eq(studyRecords.userId, userId),
          eq(studyRecords.paperId, paperId),
        ),
      )
      .orderBy(studyRecords.updatedAt);

    return records.map((r: {
      questionId: string;
      userAnswer: string;
      isCorrect: boolean | null;
      score: string | null;
      updatedAt: Date;
    }) => ({
      questionId: r.questionId,
      userAnswer: r.userAnswer,
      isCorrect: r.isCorrect,
      score: r.score !== null ? Number(r.score) : null,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getWrongStats(userId: string): Promise<WrongStatsResult> {
    const allWrong = await this.db
      .select({ mastered: wrongQuestions.mastered })
      .from(wrongQuestions)
      .where(eq(wrongQuestions.userId, userId));

    const totalWrong = allWrong.length;
    const masteredCount = allWrong.filter(
      (w: { mastered: boolean }) => w.mastered === true,
    ).length;

    const byUniversityRows = await this.db
      .select({
        universityId: universities.id,
        universityName: universities.name,
        count: count(),
      })
      .from(wrongQuestions)
      .innerJoin(questions, eq(wrongQuestions.questionId, questions.id))
      .innerJoin(examPapers, eq(questions.paperId, examPapers.id))
      .innerJoin(universities, eq(examPapers.universityId, universities.id))
      .where(
        and(
          eq(wrongQuestions.userId, userId),
          eq(wrongQuestions.mastered, false),
        ),
      )
      .groupBy(universities.id, universities.name)
      .orderBy(universities.name);

    return {
      totalWrong,
      masteredCount,
      byUniversity: byUniversityRows.map((row: {
        universityId: string;
        universityName: string;
        count: number;
      }) => ({
        universityId: row.universityId,
        universityName: row.universityName,
        count: Number(row.count),
      })),
    };
  }
}
