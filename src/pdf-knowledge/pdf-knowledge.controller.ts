import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../auth/admin.guard';
import { AskPdfKnowledgeDto } from './dto/ask-pdf-knowledge.dto';
import { PdfKnowledgeService } from './pdf-knowledge.service';

@UseGuards(AdminGuard)
@Controller('pdf-knowledge')
export class PdfKnowledgeController {
  constructor(private readonly pdfKnowledge: PdfKnowledgeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.pdfKnowledge.ingestPdf(file);
  }

  @Post('query')
  query(@Body() dto: AskPdfKnowledgeDto) {
    return this.pdfKnowledge.answerQuestion(dto.question);
  }
}
