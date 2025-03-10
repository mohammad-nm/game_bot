import { Controller, Get, Post } from '@nestjs/common';

@Controller('telegram')
export class TelegramController {
  @Get()
  getHello(): string {
    return 'api is working...';
  }
}
