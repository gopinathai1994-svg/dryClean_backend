import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PdfKnowledgeController } from './pdf-knowledge.controller';
import { PdfKnowledgeService } from './pdf-knowledge.service';

@Module({
  imports: [AuthModule],
  controllers: [PdfKnowledgeController],
  providers: [PdfKnowledgeService],
  exports: [PdfKnowledgeService],
})
export class PdfKnowledgeModule {}
