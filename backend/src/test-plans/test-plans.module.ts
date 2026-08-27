import { Module } from '@nestjs/common';
import { TestPlansService } from './test-plans.service';
import { TestPlansController } from './test-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestPlansController],
  providers: [TestPlansService],
  exports: [TestPlansService],
})
export class TestPlansModule {}
