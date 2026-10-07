import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChromaClient, type Collection } from 'chromadb';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface KnowledgeChunkMetadata {
  [key: string]: string | number | boolean;
  documentId: string;
  fileName: string;
  chunkIndex: number;
  uploadedAt: string;
}

interface LocalVectorRecord {
  id: string;
  document: string;
  embedding: number[];
  metadata: KnowledgeChunkMetadata;
}

interface VectorSearchResult {
  documents: string[];
  metadatas: KnowledgeChunkMetadata[];
}

export interface PdfUploadResult {
  success: true;
  documentId: string;
  fileName: string;
  chunksStored: number;
  charactersExtracted: number;
}

export interface PdfKnowledgeAnswer {
  success: true;
  question: string;
  answer: string;
  sources: Array<{
    fileName: string;
    chunkIndex: number;
    preview: string;
  }>;
}

const baseCollectionName = 'dry_clean_pdf_knowledge';
const maxFileSizeMb = 10;
const chunkSize = 1400;
const chunkOverlap = 220;

@Injectable()
export class PdfKnowledgeService {
  private readonly openai?: OpenAI;
  private readonly gemini?: GoogleGenAI;
  private readonly chroma: ChromaClient;
  private collection?: Collection;
  private collectionName = baseCollectionName;

  constructor(private readonly config: ConfigService) {
    const openaiApiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    const geminiApiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();

    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }

    if (geminiApiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    }

    this.chroma = new ChromaClient(this.chromaConfig());
  }

  async ingestPdf(file: Express.Multer.File): Promise<PdfUploadResult> {
    this.validatePdf(file);

    const text = await this.extractPdfText(file.buffer);
    const chunks = this.chunkText(text);

    if (!chunks.length) {
      throw new BadRequestException('No readable text was found in this PDF.');
    }

    const documentId = this.createDocumentId(file.originalname);
    const uploadedAt = new Date().toISOString();
    const embeddings = await this.embed(chunks);
    const metadatas = chunks.map((_, index) => ({
      documentId,
      fileName: file.originalname,
      chunkIndex: index,
      uploadedAt,
    }));

    await this.upsertDocuments({
      ids: chunks.map((_, index) => `${documentId}:${index}`),
      documents: chunks,
      embeddings,
      metadatas,
    });

    return {
      success: true,
      documentId,
      fileName: file.originalname,
      chunksStored: chunks.length,
      charactersExtracted: text.length,
    };
  }

  async answerQuestion(question: string): Promise<PdfKnowledgeAnswer> {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      throw new BadRequestException('Question is required.');
    }

    const [questionEmbedding] = await this.embed([cleanQuestion]);
    const results = await this.queryDocuments(questionEmbedding, 8);
    const documents = results.documents;
    const metadatas = results.metadatas;

    if (!documents.length) {
      return {
        success: true,
        question: cleanQuestion,
        answer: 'Uploaded PDF la relevant information currently illa. Correct PDF upload pannitu again query pannunga.',
        sources: [],
      };
    }

    const answer = await this.generateAnswer(cleanQuestion, documents);

    return {
      success: true,
      question: cleanQuestion,
      answer,
      sources: documents.map((document, index) => {
        const metadata = metadatas[index] as KnowledgeChunkMetadata | undefined;
        return {
          fileName: metadata?.fileName || 'Uploaded PDF',
          chunkIndex: Number(metadata?.chunkIndex ?? index),
          preview: this.preview(document),
        };
      }),
    };
  }

  private validatePdf(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('PDF file is required.');
    }

    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new BadRequestException('Only PDF files are supported.');
    }

    if (file.size > maxFileSizeMb * 1024 * 1024) {
      throw new BadRequestException(`PDF file must be ${maxFileSizeMb}MB or smaller.`);
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown PDF parsing error';
      throw new BadRequestException(`Unable to read PDF text: ${message}`);
    } finally {
      await parser.destroy();
    }
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];

    for (let start = 0; start < text.length; start += chunkSize - chunkOverlap) {
      const rawChunk = text.slice(start, start + chunkSize).trim();
      if (rawChunk.length >= 40) {
        chunks.push(rawChunk);
      }
    }

    return chunks;
  }

  private async embed(inputs: string[]): Promise<number[][]> {
    if (this.openai) {
      return this.embedWithOpenAi(inputs);
    }

    if (this.gemini) {
      return this.embedWithGemini(inputs);
    }

    throw new ServiceUnavailableException(
      'OPENAI_API_KEY or GEMINI_API_KEY is required in backend/.env for PDF embeddings.',
    );
  }

  private async embedWithOpenAi(inputs: string[]): Promise<number[][]> {
    const openai = this.openai;
    if (!openai) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is required for OpenAI embeddings.');
    }

    try {
      const model = this.config.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';
      const response = await openai.embeddings.create({
        model,
        input: inputs,
      });

      this.useCollection(`${baseCollectionName}_openai_${this.safeCollectionPart(model)}`);
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenAI embeddings error';
      throw new InternalServerErrorException(`Unable to generate embeddings: ${message}`);
    }
  }

  private async embedWithGemini(inputs: string[]): Promise<number[][]> {
    const gemini = this.gemini;
    if (!gemini) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is required for Gemini embeddings.');
    }

    const configuredModel = this.config.get<string>('GEMINI_EMBEDDING_MODEL')?.trim();
    const candidateModels = this.unique([
      configuredModel,
      'gemini-embedding-001',
      'models/gemini-embedding-001',
      'embedding-001',
      'models/embedding-001',
      'text-embedding-004',
      'models/text-embedding-004',
    ]);
    const errors: string[] = [];

    for (const model of candidateModels) {
      try {
        const response = await gemini.models.embedContent({
          model,
          contents: inputs,
        });

        const embeddings = response.embeddings?.map((item) => item.values || []) ?? [];

        if (embeddings.length !== inputs.length || embeddings.some((item) => !item.length)) {
          throw new Error('Gemini returned incomplete embeddings');
        }

        this.useCollection(`${baseCollectionName}_gemini_${this.safeCollectionPart(model)}`);
        return embeddings;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Gemini embeddings error';
        errors.push(`${model}: ${message}`);

        if (!this.isRetryableGeminiModelError(message)) {
          break;
        }
      }
    }

    throw new InternalServerErrorException(
      `Unable to generate Gemini embeddings with available fallback models. ${errors.join(' | ')}`,
    );
  }

  private async generateAnswer(question: string, documents: string[]): Promise<string> {
    if (this.openai) {
      return this.generateOpenAiAnswer(question, documents);
    }

    if (this.gemini) {
      return this.generateGeminiAnswer(question, documents);
    }

    throw new ServiceUnavailableException(
      'OPENAI_API_KEY or GEMINI_API_KEY is required in backend/.env for PDF answers.',
    );
  }

  private async generateOpenAiAnswer(question: string, documents: string[]): Promise<string> {
    const openai = this.openai;
    if (!openai) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is required for OpenAI answers.');
    }

    const context = documents.map((document, index) => `Source ${index + 1}:\n${document}`).join('\n\n');

    try {
      const response = await openai.responses.create({
        model: this.config.get<string>('OPENAI_CHAT_MODEL') || 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content:
              'You answer questions for a laundry/dry-cleaning admin. Use only the uploaded PDF context. If the context has a pricing table, identify the requested item and service exactly, then answer with the exact price. If the user says "iron", compare Steam Ironing and Wash & Iron when both are relevant. If the answer is not in the context, say the PDF does not contain that information. Do not invent missing prices. Keep answers short and clear. Tamil-English mixed answers are allowed.',
          },
          {
            role: 'user',
            content: `Uploaded PDF context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
      });

      const answer = response.output_text?.trim();

      if (!answer) {
        throw new Error('OpenAI returned an empty answer');
      }

      return answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenAI response error';
      throw new InternalServerErrorException(`Unable to generate answer: ${message}`);
    }
  }

  private async generateGeminiAnswer(question: string, documents: string[]): Promise<string> {
    const gemini = this.gemini;
    if (!gemini) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is required for Gemini answers.');
    }

    const context = documents.map((document, index) => `Source ${index + 1}:\n${document}`).join('\n\n');

    try {
      const response = await gemini.models.generateContent({
        model: this.config.get<string>('GEMINI_CHAT_MODEL') || 'gemini-2.5-flash',
        contents: `
You answer questions for a laundry/dry-cleaning admin.
Use only the uploaded PDF context.
If the answer is not in the context, say the PDF does not contain that information.
If the context has a pricing table, identify the requested item and service exactly, then answer with the exact price.
For example: "Shirt Steam Ironing price is ₹10."
If the user says "iron", compare Steam Ironing and Wash & Iron when both are relevant.
Do not invent missing prices. Keep answers short and clear. Tamil-English mixed answers are allowed.

Uploaded PDF context:
${context}

Question:
${question}

Final answer:
`.trim(),
      });

      const answer = response.text?.trim();

      if (!answer) {
        throw new Error('Gemini returned an empty answer');
      }

      return answer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Gemini response error';
      throw new InternalServerErrorException(`Unable to generate Gemini answer: ${message}`);
    }
  }

  private async getCollection(): Promise<Collection> {
    if (this.collection) {
      return this.collection;
    }

    try {
      this.collection = await this.chroma.getOrCreateCollection({ name: this.collectionName });
      return this.collection;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ChromaDB error';
      throw new ServiceUnavailableException(
        `Unable to connect to ChromaDB. Start it with "npx chroma run --path ./chroma-data". Details: ${message}`,
      );
    }
  }

  private async tryGetCollection(): Promise<Collection | undefined> {
    try {
      return await this.getCollection();
    } catch {
      return undefined;
    }
  }

  private async upsertDocuments(args: {
    ids: string[];
    documents: string[];
    embeddings: number[][];
    metadatas: KnowledgeChunkMetadata[];
  }): Promise<void> {
    const collection = await this.tryGetCollection();

    if (collection) {
      await collection.upsert(args);
      return;
    }

    await this.upsertLocalDocuments(args);
  }

  private async queryDocuments(queryEmbedding: number[], nResults: number): Promise<VectorSearchResult> {
    const collection = await this.tryGetCollection();

    if (collection) {
      const results = await collection.query<KnowledgeChunkMetadata>({
        queryEmbeddings: [queryEmbedding],
        nResults,
        include: ['documents', 'metadatas', 'distances'],
      });

      const documents = results.documents?.[0]?.filter((document): document is string => !!document) ?? [];
      const metadatas = (results.metadatas?.[0] ?? []) as KnowledgeChunkMetadata[];

      if (documents.length) {
        return { documents, metadatas };
      }
    }

    return this.queryLocalDocuments(queryEmbedding, nResults);
  }

  private async upsertLocalDocuments(args: {
    ids: string[];
    documents: string[];
    embeddings: number[][];
    metadatas: KnowledgeChunkMetadata[];
  }): Promise<void> {
    const records = await this.readLocalRecords();
    const byId = new Map(records.map((record) => [record.id, record]));

    args.ids.forEach((id, index) => {
      byId.set(id, {
        id,
        document: args.documents[index],
        embedding: args.embeddings[index],
        metadata: args.metadatas[index],
      });
    });

    await this.writeLocalRecords(Array.from(byId.values()));
  }

  private async queryLocalDocuments(queryEmbedding: number[], nResults: number): Promise<VectorSearchResult> {
    const records = await this.readLocalRecords();
    const ranked = records
      .filter((record) => record.embedding.length === queryEmbedding.length)
      .map((record) => ({
        record,
        score: this.cosineSimilarity(queryEmbedding, record.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, nResults)
      .filter((item) => Number.isFinite(item.score) && item.score > 0);

    return {
      documents: ranked.map((item) => item.record.document),
      metadatas: ranked.map((item) => item.record.metadata),
    };
  }

  private async readLocalRecords(): Promise<LocalVectorRecord[]> {
    try {
      const raw = await fs.readFile(this.localStorePath(), 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as LocalVectorRecord[]) : [];
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }

      const message = error instanceof Error ? error.message : 'Unknown local vector store error';
      throw new InternalServerErrorException(`Unable to read local PDF vector store: ${message}`);
    }
  }

  private async writeLocalRecords(records: LocalVectorRecord[]): Promise<void> {
    const filePath = this.localStorePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf8');
  }

  private localStorePath(): string {
    return path.join(process.cwd(), 'storage', `${this.collectionName}.json`);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;

    for (let index = 0; index < a.length; index += 1) {
      dot += a[index] * b[index];
      aMagnitude += a[index] * a[index];
      bMagnitude += b[index] * b[index];
    }

    if (!aMagnitude || !bMagnitude) {
      return 0;
    }

    return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
  }

  private isMissingFileError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
  }

  private chromaConfig(): ConstructorParameters<typeof ChromaClient>[0] {
    const url = this.config.get<string>('CHROMA_URL')?.trim();

    if (url) {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)),
        ssl: parsed.protocol === 'https:',
      };
    }

    return {
      host: this.config.get<string>('CHROMA_HOST') || 'localhost',
      port: Number(this.config.get<string>('CHROMA_PORT') || 8000),
      ssl: this.config.get<string>('CHROMA_SSL') === 'true',
    };
  }

  private createDocumentId(fileName: string): string {
    const safeName = fileName
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 48);

    return `${safeName || 'pdf'}-${Date.now()}`;
  }

  private preview(document: string): string {
    return document.length > 220 ? `${document.slice(0, 220)}...` : document;
  }

  private useCollection(name: string): void {
    if (this.collectionName !== name) {
      this.collectionName = name;
      this.collection = undefined;
    }
  }

  private safeCollectionPart(value: string): string {
    return value
      .replace(/^models\//, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '')
      .slice(0, 45);
  }

  private unique(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => !!value)));
  }

  private isRetryableGeminiModelError(message: string): boolean {
    return /not found|not supported|unsupported|404/i.test(message);
  }
}
