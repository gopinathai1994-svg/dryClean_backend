import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AskChatDto } from './dto/ask-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('ask')
  ask(@Body() dto: AskChatDto) {
    return this.chat.ask(dto.question);
  }
}

@Controller('api/chat')
export class ChatApiController {
  constructor(private readonly chat: ChatService) {}

  @Post('ask')
  ask(@Body() dto: AskChatDto) {
    return this.chat.ask(dto.question);
  }
}
