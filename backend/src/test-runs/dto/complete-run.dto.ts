import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RunStatus } from '@prisma/client';

export class CompleteRunDto {
  @ApiProperty({ enum: RunStatus, example: RunStatus.COMPLETED, required: false })
  @IsEnum(RunStatus)
  @IsOptional()
  status?: RunStatus = RunStatus.COMPLETED;
}
