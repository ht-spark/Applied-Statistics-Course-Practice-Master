import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StudyService } from './study.service';
import type { WrongStatsResult } from './study.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/study')
@UseGuards(JwtAuthGuard)
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get('stats')
  async getStats(@CurrentUser() userId: string) {
    return this.studyService.getStats(userId);
  }

  @Get('paper/:paperId')
  async getPaperRecords(
    @CurrentUser() userId: string,
    @Param('paperId') paperId: string,
  ) {
    return this.studyService.getPaperRecords(userId, paperId);
  }

  @Get('wrong-stats')
  async getWrongStats(@CurrentUser() userId: string): Promise<WrongStatsResult> {
    return this.studyService.getWrongStats(userId);
  }
}
