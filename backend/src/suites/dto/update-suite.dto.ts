import { PartialType } from '@nestjs/swagger';
import { CreateSuiteDto } from './create-suite.dto';

export class UpdateSuiteDto extends PartialType(CreateSuiteDto) {}
