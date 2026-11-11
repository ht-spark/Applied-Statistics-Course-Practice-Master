import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  FavoritesQueryDto,
  MarkMasteredDto,
  SubmitAnswerDto,
  ToggleFavoriteDto,
  WrongQuestionsQueryDto,
} from './question.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // 1. 获取单题详情（含正确答案和解析）
  @Get('questions/:id')
  async getQuestion(@Param('id') id: string) {
    return this.questionService.getQuestionDetail(id);
  }

  // 2. 提交答案
  @Post('questions/:id/submit')
  async submitAnswer(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: SubmitAnswerDto,
  ) {
    return this.questionService.submitAnswer(
      userId,
      id,
      body.userAnswer,
    );
  }

  // 3. 收藏/取消收藏
  @Post('questions/:id/favorite')
  async toggleFavorite(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: ToggleFavoriteDto,
  ) {
    return this.questionService.toggleFavorite(
      userId,
      id,
      body.favorite,
    );
  }

  // 4. 收藏列表
  @Get('favorites')
  async getFavorites(
    @CurrentUser() userId: string,
    @Query() query: FavoritesQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return this.questionService.getFavorites(userId, page, pageSize);
  }

  // 5. 错题本列表
  @Get('wrong-questions')
  async getWrongQuestions(
    @CurrentUser() userId: string,
    @Query() query: WrongQuestionsQueryDto,
  ) {
    return this.questionService.getWrongQuestions(userId, query);
  }

  // 6. 标记错题已掌握
  @Patch('wrong-questions/:questionId/master')
  async markMastered(
    @CurrentUser() userId: string,
    @Param('questionId') questionId: string,
    @Body() body: MarkMasteredDto,
  ) {
    return this.questionService.markMastered(
      userId,
      questionId,
      body.mastered,
    );
  }
}
