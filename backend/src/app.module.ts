import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { SuitesModule } from './suites/suites.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { TestRunsModule } from './test-runs/test-runs.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { TestPlansModule } from './test-plans/test-plans.module';
import { DefectsModule } from './defects/defects.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    TestPlansModule,
    SuitesModule,
    TestCasesModule,
    TestRunsModule,
    ReportsModule,
    UsersModule,
    DefectsModule,
    WebhooksModule,
  ],
})
export class AppModule {}

