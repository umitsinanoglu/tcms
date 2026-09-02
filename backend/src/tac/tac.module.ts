import { Module } from '@nestjs/common';
import { TACController } from './tac.controller';
import { TACService } from './tac.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TACController],
  providers: [TACService],
  exports: [TACService],
})
export class TACModule {}
