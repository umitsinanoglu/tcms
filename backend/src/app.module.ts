import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { SuitesModule } from './suites/suites.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { TestRunsModule } from './test-runs/test-runs.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    SuitesModule,
    TestCasesModule,
    TestRunsModule,
    ReportsModule,
  ],
})
export class AppModule {}
