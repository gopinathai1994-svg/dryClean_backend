import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const businessContext = `
Dry Cleaning Rules:

Silk saree dry cleaning is available.
Blazer and coat dry cleaning are available.
Stain removal depends on fabric and stain condition.
100% stain removal guarantee is not provided.

Pickup and Delivery:

Pickup available in Koundampalayam, Saibaba Colony, and RS Puram.
Minimum order for free pickup is ₹150.
Normal delivery time is 24 hours.
Express delivery is available within 6 hours with extra charge.

Shop Rules:

Customer should check clothes during delivery.
Lost item complaint should be raised within 24 hours.
`.trim();

@Injectable()
export class GeminiService {
  private readonly gemini?: GoogleGenAI;
  private readonly openai?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const geminiApiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    const openAiApiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();

    if (geminiApiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    }

    if (openAiApiKey) {
      this.openai = new OpenAI({ apiKey: openAiApiKey });
    }
  }

  async generateAnswer(question: string, pricingContext: string): Promise<string> {
    if (this.gemini) {
      return this.generateGeminiAnswer(question, pricingContext);
    }

    if (this.openai) {
      return this.generateOpenAiAnswer(question, pricingContext);
    }

    throw new ServiceUnavailableException(
      'GEMINI_API_KEY or OPENAI_API_KEY is required in backend/.env for chatbot answers.',
    );
  }

  private async generateGeminiAnswer(question: string, pricingContext: string): Promise<string> {
    try {
      const response = await this.gemini!.models.generateContent({
        model: this.config.get<string>('GEMINI_CHAT_MODEL') || 'gemini-2.5-flash',
        contents: this.buildPrompt(question, pricingContext),
      });

      const answer = response.text?.trim();

      if (!answer) {
        throw new Error('Gemini returned an empty answer');
      }

      return answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Gemini API error';
      throw new InternalServerErrorException(`Unable to generate chatbot answer: ${message}`);
    }
  }

  private async generateOpenAiAnswer(question: string, pricingContext: string): Promise<string> {
    try {
      const response = await this.openai!.responses.create({
        model: this.config.get<string>('OPENAI_CHAT_MODEL') || 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: this.buildSystemPrompt(),
          },
          {
            role: 'user',
            content: `Price List from app pricing screen:\n${pricingContext}\n\nCustomer Question:\n${question}`,
          },
        ],
      });

      const answer = response.output_text?.trim();

      if (!answer) {
        throw new Error('OpenAI returned an empty answer');
      }

      return answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenAI API error';
      throw new InternalServerErrorException(`Unable to generate chatbot answer: ${message}`);
    }
  }

  private buildSystemPrompt(): string {
    return `
You are Gopi Laundry AI Assistant.

Use only the provided business context to answer customer questions.
Do not create fake prices, fake offers, fake timings, fake pickup areas, or fake guarantees.
For price questions, use the Price List from app pricing screen first.
Answer only in Tamil, English, or simple Tamil-English mixed language. Do not use any other language.
Keep the answer short, friendly, and useful.
If the answer is not available in the context, say:
"இந்த information currently available illa. Shop admin contact pannunga."
For stain questions, say it depends on fabric and stain condition.
Always end with one helpful next step such as "Book pickup panna sollunga" or "Pickup area share pannunga."

Business Context:
${businessContext}
`.trim();
  }

  private buildPrompt(question: string, pricingContext: string): string {
    return `
You are Gopi Laundry AI Assistant.

Use only the provided business context to answer customer questions.
Do not create fake prices, fake offers, fake timings, fake pickup areas, or fake guarantees.
For price questions, use the Price List from app pricing screen first.
Answer only in Tamil, English, or simple Tamil-English mixed language. Do not use any other language.
Keep the answer short, friendly, and useful.
If the answer is not available in the context, say:
“இந்த information currently available illa. Shop admin contact pannunga.”
For stain questions, say it depends on fabric and stain condition.
Always end with one helpful next step such as “Book pickup panna sollunga” or “Pickup area share pannunga.”

Business Context:
${businessContext}

Price List from app pricing screen:
${pricingContext}

Customer Question:
${question}

Final Answer:
`.trim();
  }
}

