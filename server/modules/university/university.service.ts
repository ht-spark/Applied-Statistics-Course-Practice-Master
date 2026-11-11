import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/context';
import { eq, and, ilike, asc, count, inArray } from 'drizzle-orm';
import type { University, ExamPaperSummary } from '@shared/api.interface';
import { universities, examPapers, questions, questionOptions } from '@server/database/schema';
import { UniversityListQueryDto } from './university.dto';

interface PaperQuestion {
  id: string;
  questionType: string;
  questionNumber: number;
  content: string;
  score: number;
  difficulty: number;
  knowledgePoint: string;
  options: { id: string; optionKey: string; content: string }[];
}

interface PaperDetailWithCount {
  id: string;
  universityId: string;
  year: number;
  title: string;
  description: string;
  totalScore: number;
  duration: number;
  isPremium: boolean;
  questionCount: number;
}

export interface UniversityDetailResponse {
  university: University;
  papers: ExamPaperSummary[];
}

export interface PaperDetailResponse {
  paper: PaperDetailWithCount;
  questions: PaperQuestion[];
}

@Injectable()
export class UniversityService {
  private readonly logger = new Logger(UniversityService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getUniversities(query: UniversityListQueryDto): Promise<University[]> {
    const conditions = [];
    if (query.keyword) {
      conditions.push(ilike(universities.name, `%${query.keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const uniRows = await this.db
      .select()
      .from(universities)
      .where(whereClause)
      .orderBy(asc(universities.sortOrder));

    if (uniRows.length === 0) {
      return [];
    }

    const uniIds = uniRows.map((u) => u.id);
    const paperCountRows = await this.db
      .select({
        universityId: examPapers.universityId,
        count: count(),
      })
      .from(examPapers)
      .where(inArray(examPapers.universityId, uniIds))
      .groupBy(examPapers.universityId);

    const paperCountMap = new Map<string, number>();
    for (const row of paperCountRows) {
      paperCountMap.set(row.universityId, row.count);
    }

    const universitiesWithCount: University[] = uniRows.map((uni) => ({
      id: uni.id,
      name: uni.name,
      shortName: uni.shortName,
      location: uni.location,
      description: uni.description,
      isPremium: uni.isPremium,
      price: String(uni.price),
      paperCount: paperCountMap.get(uni.id) ?? 0,
    }));

    return universitiesWithCount;
  }

  async getUniversityDetail(id: string): Promise<UniversityDetailResponse> {
    const uniRows = await this.db
      .select()
      .from(universities)
      .where(eq(universities.id, id));

    if (uniRows.length === 0) {
      throw new NotFoundException('院校不存在');
    }
    const uni = uniRows[0];

    const paperRows = await this.db
      .select()
      .from(examPapers)
      .where(eq(examPapers.universityId, id))
      .orderBy(asc(examPapers.sortOrder));

    const paperIds = paperRows.map((p) => p.id);
    let questionCountMap = new Map<string, number>();
    if (paperIds.length > 0) {
      const qCountRows = await this.db
        .select({
          paperId: questions.paperId,
          count: count(),
        })
        .from(questions)
        .where(inArray(questions.paperId, paperIds))
        .groupBy(questions.paperId);

      for (const row of qCountRows) {
        questionCountMap.set(row.paperId, row.count);
      }
    }

    const papers: ExamPaperSummary[] = paperRows.map((paper) => ({
      id: paper.id,
      universityId: paper.universityId,
      year: paper.year,
      title: paper.title,
      description: paper.description,
      totalScore: paper.totalScore,
      duration: paper.duration,
      isPremium: paper.isPremium,
      questionCount: questionCountMap.get(paper.id) ?? 0,
    }));

    const [{ count: paperCount }] = await this.db
      .select({ count: count() })
      .from(examPapers)
      .where(eq(examPapers.universityId, id));

    return {
      university: {
        id: uni.id,
        name: uni.name,
        shortName: uni.shortName,
        location: uni.location,
        description: uni.description,
        isPremium: uni.isPremium,
        price: String(uni.price),
        paperCount,
      },
      papers,
    };
  }

  async getPaperDetail(id: string): Promise<PaperDetailResponse> {
    const paperRows = await this.db
      .select()
      .from(examPapers)
      .where(eq(examPapers.id, id));

    if (paperRows.length === 0) {
      throw new NotFoundException('套卷不存在');
    }
    const paper = paperRows[0];

    const questionRows = await this.db
      .select()
      .from(questions)
      .where(eq(questions.paperId, id))
      .orderBy(asc(questions.questionNumber));

    const questionCount = questionRows.length;

    let optionsByQuestion: Map<string, typeof questionOptions.$inferSelect[]> = new Map();
    const questionIds = questionRows.map((q) => q.id);

    if (questionIds.length > 0) {
      const opts = await this.db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, questionIds))
        .orderBy(asc(questionOptions.sortOrder));

      for (const opt of opts) {
        const existing = optionsByQuestion.get(opt.questionId) ?? [];
        existing.push(opt);
        optionsByQuestion.set(opt.questionId, existing);
      }
    }

    const questionsList: PaperQuestion[] = questionRows.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      questionNumber: q.questionNumber,
      content: q.content,
      score: q.score,
      difficulty: q.difficulty,
      knowledgePoint: q.knowledgePoint,
      options: (optionsByQuestion.get(q.id) ?? []).map((opt) => ({
        id: opt.id,
        optionKey: opt.optionKey,
        content: opt.content,
      })),
    }));

    return {
      paper: {
        id: paper.id,
        universityId: paper.universityId,
        year: paper.year,
        title: paper.title,
        description: paper.description,
        totalScore: paper.totalScore,
        duration: paper.duration,
        isPremium: paper.isPremium,
        questionCount,
      },
      questions: questionsList,
    };
  }
}
