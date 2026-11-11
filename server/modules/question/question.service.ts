import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/context';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
  QuestionDetail,
  QuestionOption,
  SubmitAnswerResponse,
  PageResult,
} from '@shared/api.interface';
import { isQuestionType } from '@shared/api.interface';
import {
  questions,
  questionOptions,
  studyRecords,
  wrongQuestions,
  favorites,
  examPapers,
  universities,
} from '@server/database/schema';
import type { WrongQuestionsQueryDto } from './question.dto';

const OBJECTIVE_TYPES = ['single_choice', 'multiple_choice', 'true_false'] as const;
type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];
const isObjective = (t: string): t is ObjectiveType =>
  (OBJECTIVE_TYPES as readonly string[]).includes(t);

function normalizeAnswer(answer: string, questionType: string): string {
  const trimmed = answer.trim();
  if (questionType === 'multiple_choice') {
    // 多选题答案按字母顺序排序后用逗号连接，保证比对一致
    return trimmed
      .split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => s.length > 0)
      .sort()
      .join(',');
  }
  if (questionType === 'true_false') {
    // 判断题答案归一化为 'true' / 'false'
    const lower = trimmed.toLowerCase();
    if (lower === 'true' || lower === 't' || lower === '1' || lower === '对') {
      return 'true';
    }
    if (lower === 'false' || lower === 'f' || lower === '0' || lower === '错') {
      return 'false';
    }
    return lower;
  }
  if (questionType === 'single_choice') {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ========== 1. 获取单题详情 ==========
  async getQuestionDetail(id: string): Promise<QuestionDetail> {
    const qRows = await this.db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (qRows.length === 0) {
      throw new NotFoundException('题目不存在');
    }

    const q = qRows[0];

    if (!isQuestionType(q.questionType)) {
      // 防御性：类型未知时按字符串原样返回
      this.logger.warn(`未知题型: questionId=${id}, type=${q.questionType}`);
    }

    const opts = await this.db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, id))
      .orderBy(questionOptions.sortOrder);

    const options: QuestionOption[] = opts.map((o) => ({
      id: o.id,
      questionId: o.questionId,
      optionKey: o.optionKey,
      content: o.content,
    }));

    return {
      id: q.id,
      paperId: q.paperId,
      questionType: q.questionType as QuestionDetail['questionType'],
      questionNumber: q.questionNumber,
      content: q.content,
      correctAnswer: q.correctAnswer,
      analysis: q.analysis,
      score: q.score,
      difficulty: q.difficulty,
      knowledgePoint: q.knowledgePoint,
      options,
    };
  }

  // ========== 2. 提交答案 ==========
  async submitAnswer(
    userId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<SubmitAnswerResponse> {
    const qRows = await this.db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (qRows.length === 0) {
      throw new NotFoundException('题目不存在');
    }

    const q = qRows[0];
    const qType = q.questionType;

    let isCorrect: boolean | null = null;
    let score: number | null = null;
    let addedToWrong = false;

    const normalizedUser = normalizeAnswer(userAnswer, qType);
    const normalizedCorrect = normalizeAnswer(q.correctAnswer, qType);

    if (isObjective(qType)) {
      isCorrect = normalizedUser === normalizedCorrect;
      score = isCorrect ? q.score : 0;
    }
    // 主观题不自动判分，isCorrect=null, score=null

    // 写入 study_records（ON CONFLICT UPDATE）
    await this.db.execute(sql`
      INSERT INTO study_records (id, user_id, paper_id, question_id, user_answer, is_correct, score, _updated_at)
      VALUES (gen_random_uuid(), ${userId}::uuid, ${q.paperId}::uuid, ${questionId}::uuid, ${userAnswer}, ${isCorrect}, ${score !== null ? String(score) : null}::numeric, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, question_id) DO UPDATE SET
        user_answer = EXCLUDED.user_answer,
        is_correct = EXCLUDED.is_correct,
        score = EXCLUDED.score,
        _updated_at = CURRENT_TIMESTAMP
    `);

    // 客观题答错 → 写入/更新错题本
    if (isObjective(qType) && isCorrect === false) {
      await this.db.execute(sql`
        INSERT INTO wrong_questions (id, user_id, question_id, wrong_count, last_wrong_answer, last_wrong_at, mastered)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${questionId}::uuid, 1, ${userAnswer}, CURRENT_TIMESTAMP, false)
        ON CONFLICT (user_id, question_id) DO UPDATE SET
          wrong_count = wrong_questions.wrong_count + 1,
          last_wrong_answer = EXCLUDED.last_wrong_answer,
          last_wrong_at = CURRENT_TIMESTAMP,
          mastered = false
      `);
      addedToWrong = true;
    }

    return {
      isCorrect,
      score,
      correctAnswer: q.correctAnswer,
      analysis: q.analysis,
      addedToWrong,
    };
  }

  // ========== 3. 收藏/取消收藏 ==========
  async toggleFavorite(
    userId: string,
    questionId: string,
    favorite: boolean,
  ): Promise<{ favorited: boolean }> {
    // 校验题目存在
    const qRows = await this.db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);
    if (qRows.length === 0) {
      throw new NotFoundException('题目不存在');
    }

    if (favorite) {
      await this.db.execute(sql`
        INSERT INTO favorites (id, user_id, question_id)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${questionId}::uuid)
        ON CONFLICT (user_id, question_id) DO NOTHING
      `);
    } else {
      await this.db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.questionId, questionId),
          ),
        );
    }

    return { favorited: favorite };
  }

  // ========== 4. 收藏列表 ==========
  async getFavorites(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<
    PageResult<{
      id: string;
      questionId: string;
      createdAt: string;
      question: {
        id: string;
        questionType: string;
        questionNumber: number;
        content: string;
        paperId: string;
      };
      paper: {
        id: string;
        title: string;
        year: number;
        universityId: string;
      };
      university: {
        id: string;
        name: string;
        shortName: string;
      };
    }>
  > {
    const offset = (page - 1) * pageSize;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select({
        favId: favorites.id,
        favQuestionId: favorites.questionId,
        favCreatedAt: favorites.createdAt,
        qId: questions.id,
        qType: questions.questionType,
        qNumber: questions.questionNumber,
        qContent: questions.content,
        qPaperId: questions.paperId,
        pId: examPapers.id,
        pTitle: examPapers.title,
        pYear: examPapers.year,
        pUniversityId: examPapers.universityId,
        uId: universities.id,
        uName: universities.name,
        uShortName: universities.shortName,
      })
      .from(favorites)
      .innerJoin(questions, eq(favorites.questionId, questions.id))
      .innerJoin(examPapers, eq(questions.paperId, examPapers.id))
      .innerJoin(universities, eq(examPapers.universityId, universities.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items = rows.map((r) => ({
      id: r.favId,
      questionId: r.favQuestionId,
      createdAt: r.favCreatedAt.toISOString(),
      question: {
        id: r.qId,
        questionType: r.qType,
        questionNumber: r.qNumber,
        content: r.qContent,
        paperId: r.qPaperId,
      },
      paper: {
        id: r.pId,
        title: r.pTitle,
        year: r.pYear,
        universityId: r.pUniversityId,
      },
      university: {
        id: r.uId,
        name: r.uName,
        shortName: r.uShortName,
      },
    }));

    return { items, total, page, pageSize };
  }

  // ========== 5. 错题本列表 ==========
  async getWrongQuestions(
    userId: string,
    query: WrongQuestionsQueryDto,
  ): Promise<
    PageResult<{
      id: string;
      questionId: string;
      wrongCount: number;
      lastWrongAnswer: string;
      lastWrongAt: string;
      mastered: boolean;
      question: {
        id: string;
        questionType: string;
        questionNumber: number;
        content: string;
        paperId: string;
      };
      paper: {
        id: string;
        title: string;
        year: number;
        universityId: string;
      };
      university: {
        id: string;
        name: string;
        shortName: string;
      };
    }>
  > {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [
      eq(wrongQuestions.userId, userId),
      eq(wrongQuestions.mastered, false),
    ];

    if (query.questionType) {
      conditions.push(eq(questions.questionType, query.questionType));
    }
    if (query.universityId) {
      conditions.push(eq(universities.id, query.universityId));
    }

    const whereClause = and(...conditions);

    // count 需要 join 因为有 university / questionType 筛选
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(wrongQuestions)
      .innerJoin(questions, eq(wrongQuestions.questionId, questions.id))
      .innerJoin(examPapers, eq(questions.paperId, examPapers.id))
      .innerJoin(universities, eq(examPapers.universityId, universities.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select({
        wqId: wrongQuestions.id,
        wqQuestionId: wrongQuestions.questionId,
        wqWrongCount: wrongQuestions.wrongCount,
        wqLastWrongAnswer: wrongQuestions.lastWrongAnswer,
        wqLastWrongAt: wrongQuestions.lastWrongAt,
        wqMastered: wrongQuestions.mastered,
        qId: questions.id,
        qType: questions.questionType,
        qNumber: questions.questionNumber,
        qContent: questions.content,
        qPaperId: questions.paperId,
        pId: examPapers.id,
        pTitle: examPapers.title,
        pYear: examPapers.year,
        pUniversityId: examPapers.universityId,
        uId: universities.id,
        uName: universities.name,
        uShortName: universities.shortName,
      })
      .from(wrongQuestions)
      .innerJoin(questions, eq(wrongQuestions.questionId, questions.id))
      .innerJoin(examPapers, eq(questions.paperId, examPapers.id))
      .innerJoin(universities, eq(examPapers.universityId, universities.id))
      .where(whereClause)
      .orderBy(desc(wrongQuestions.lastWrongAt))
      .limit(pageSize)
      .offset(offset);

    const items = rows.map((r) => ({
      id: r.wqId,
      questionId: r.wqQuestionId,
      wrongCount: r.wqWrongCount,
      lastWrongAnswer: r.wqLastWrongAnswer,
      lastWrongAt: r.wqLastWrongAt.toISOString(),
      mastered: r.wqMastered,
      question: {
        id: r.qId,
        questionType: r.qType,
        questionNumber: r.qNumber,
        content: r.qContent,
        paperId: r.qPaperId,
      },
      paper: {
        id: r.pId,
        title: r.pTitle,
        year: r.pYear,
        universityId: r.pUniversityId,
      },
      university: {
        id: r.uId,
        name: r.uName,
        shortName: r.uShortName,
      },
    }));

    return { items, total, page, pageSize };
  }

  // ========== 6. 标记错题已掌握 ==========
  async markMastered(
    userId: string,
    questionId: string,
    mastered: boolean,
  ): Promise<{ mastered: boolean }> {
    const updated = await this.db
      .update(wrongQuestions)
      .set({ mastered })
      .where(
        and(
          eq(wrongQuestions.userId, userId),
          eq(wrongQuestions.questionId, questionId),
        ),
      )
      .returning({ id: wrongQuestions.id });

    if (updated.length === 0) {
      throw new NotFoundException('错题记录不存在');
    }

    return { mastered };
  }
}
