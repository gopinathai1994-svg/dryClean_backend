import { Injectable } from '@nestjs/common';
import { PdfKnowledgeService } from '../pdf-knowledge/pdf-knowledge.service';
import { PricingService } from '../pricing/pricing.service';
import { GeminiService } from './gemini.service';

export interface ChatAnswer {
  success: true;
  question: string;
  answer: string;
  speechText: string;
  source: 'uploaded-pdf' | 'pricing-database';
  sources?: Array<{
    fileName: string;
    chunkIndex: number;
    preview: string;
  }>;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly pricing: PricingService,
    private readonly pdfKnowledge: PdfKnowledgeService,
  ) {}

  async ask(question: string): Promise<ChatAnswer> {
    const cleanQuestion = question.trim();
    const pdfAnswer = await this.tryPdfPricingAnswer(cleanQuestion);

    if (pdfAnswer) {
      return pdfAnswer;
    }

    const pricingContext = await this.buildPricingContext();
    const answer = await this.gemini.generateAnswer(cleanQuestion, pricingContext);

    return {
      success: true,
      question: cleanQuestion,
      answer,
      speechText: this.toSpeechText(answer),
      source: 'pricing-database',
    };
  }

  private async tryPdfPricingAnswer(question: string): Promise<ChatAnswer | undefined> {
    if (!this.isPricingQuestion(question)) {
      return undefined;
    }

    try {
      const pdfAnswer = await this.pdfKnowledge.answerQuestion(question);

      if (!pdfAnswer.sources.length || this.isNoPdfContextAnswer(pdfAnswer.answer)) {
        return undefined;
      }

      return {
        success: true,
        question,
        answer: pdfAnswer.answer,
        speechText: this.toSpeechText(pdfAnswer.answer),
        source: 'uploaded-pdf',
        sources: pdfAnswer.sources,
      };
    } catch {
      return undefined;
    }
  }

  private async buildPricingContext(): Promise<string> {
    const items = await this.pricing.findPublic();

    return items
      .filter((item) => item.active !== false)
      .map((item) => `${item.item} ${item.serviceType} price is ₹${item.price}.`)
      .join('\n');
  }

  private isPricingQuestion(question: string): boolean {
    return /\b(price|rate|cost|amount|rs|rupees|₹|charge|charges|pricing|list)\b/i.test(question);
  }

  private isNoPdfContextAnswer(answer: string): boolean {
    return /relevant information currently illa|does not contain|not in the context/i.test(answer);
  }

  private toSpeechText(answer: string): string {
    return answer
      .replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 rupees')
      .replace(/\bINR\s*(\d+(?:\.\d+)?)/gi, '$1 rupees')
      .replace(/&/g, ' and ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
