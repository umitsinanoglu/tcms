import { PartialType } from '@nestjs/swagger';
import { CreateTestPlanDto } from './create-test-plan.dto';

export class UpdateTestPlanDto extends PartialType(CreateTestPlanDto) {}
