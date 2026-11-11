import { Module } from '@nestjs/common';
import { UniversityController, PaperController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  controllers: [UniversityController, PaperController],
  providers: [UniversityService],
})
export class UniversityModule {}
