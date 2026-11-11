import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DRIZZLE_DATABASE, requestDatabase } from '../database/context';
import { GlobalExceptionFilter } from '../common/filters/exception.filter';
import { AuthModule } from '../modules/auth/auth.module';
import { UniversityModule } from '../modules/university/university.module';
import { QuestionModule } from '../modules/question/question.module';
import { OrderModule } from '../modules/order/order.module';
import { StudyModule } from '../modules/study/study.module';
import { AdminModule } from '../modules/admin/admin.module';

@Global()
@Module({
  providers: [{ provide: DRIZZLE_DATABASE, useValue: requestDatabase }],
  exports: [DRIZZLE_DATABASE],
})
class WorkerDatabaseModule {}

@Module({
  imports: [WorkerDatabaseModule, AuthModule, UniversityModule, QuestionModule,
    OrderModule, StudyModule, AdminModule],
  providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
})
export class WorkerAppModule {}
