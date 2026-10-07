import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskPdfKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;
}
