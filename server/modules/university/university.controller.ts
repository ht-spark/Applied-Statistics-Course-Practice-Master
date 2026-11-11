import { Controller, Get, Param, Query } from '@nestjs/common';
import { UniversityService } from './university.service';
import type {
  UniversityDetailResponse,
  PaperDetailResponse,
} from './university.service';
import { UniversityListQueryDto } from './university.dto';

@Controller('api/universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  async getUniversities(@Query() query: UniversityListQueryDto) {
    return this.universityService.getUniversities(query);
  }

  // 静态路由在前，避免 :id 匹配到 "paper"
  @Get('paper/:id')
  async getPaperDetailFromUniversity(
    @Param('id') id: string,
  ): Promise<PaperDetailResponse> {
    return this.universityService.getPaperDetail(id);
  }

  @Get(':id')
  async getUniversityDetail(
    @Param('id') id: string,
  ): Promise<UniversityDetailResponse> {
    return this.universityService.getUniversityDetail(id);
  }
}

@Controller('api/papers')
export class PaperController {
  constructor(private readonly universityService: UniversityService) {}

  @Get(':id')
  async getPaperDetail(@Param('id') id: string): Promise<PaperDetailResponse> {
    return this.universityService.getPaperDetail(id);
  }
}
