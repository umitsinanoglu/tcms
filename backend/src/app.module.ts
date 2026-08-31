import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { ProjectsModule } from './projects/projects.module';
import { SuitesModule } from './suites/suites.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { TestRunsModule } from './test-runs/test-runs.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { TestPlansModule } from './test-plans/test-plans.module';
import { DefectsModule } from './defects/defects.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettingsModule } from './settings/settings.module';
import { TACModule } from './tac/tac.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ProjectsModule,
    TestPlansModule,
    SuitesModule,
    TestCasesModule,
    TestRunsModule,
    ReportsModule,
    UsersModule,
    DefectsModule,
    WebhooksModule,
    SettingsModule,
    TACModule,
  ],
})
export class AppModule {}


