import { Module } from '@nestjs/common';
import { PdfKnowledgeModule } from '../pdf-knowledge/pdf-knowledge.module';
import { PricingModule } from '../pricing/pricing.module';
import { ChatApiController, ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [PricingModule, PdfKnowledgeModule],
  controllers: [ChatController, ChatApiController],
  providers: [ChatService, GeminiService],
})
export class ChatModule {}
