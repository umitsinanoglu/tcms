import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CsvExporter } from './exporters/csv.exporter';
import { HtmlExporter } from './exporters/html.exporter';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, CsvExporter, HtmlExporter],
  exports: [ReportsService, CsvExporter, HtmlExporter],
})
export class ReportsModule {}

