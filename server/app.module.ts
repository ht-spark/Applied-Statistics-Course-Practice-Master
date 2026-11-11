import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { UniversityModule } from './modules/university/university.module';
import { QuestionModule } from './modules/question/question.module';
import { OrderModule } from './modules/order/order.module';
import { StudyModule } from './modules/study/study.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    AuthModule,
    UniversityModule,
    QuestionModule,
    OrderModule,
    StudyModule,
    AdminModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
