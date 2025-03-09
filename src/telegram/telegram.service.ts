import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  constructor(private configService: ConfigService) {
    const BOT_TOKEN:string = this.configService.get('BOT_TOKEN');
   const bot = this.bot = new TelegramBot(BOT_TOKEN);
  }
  if(!BOT_TOKEN){
    throw new Error('BOT_TOKEN is not set');
  }
}
