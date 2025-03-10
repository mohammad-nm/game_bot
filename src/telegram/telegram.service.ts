import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  constructor(private configService: ConfigService) {
    const BOT_TOKEN: string | undefined =
      this.configService.get<string>('BOT_TOKEN');
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set');
    }
    this.bot = new TelegramBot(BOT_TOKEN);
    this.initBot();
  }
  async sendMessage(message: string, options?: object) {
    return await this.bot.sendMessage(message);
  }
  async editMessage(newMessage: string, message_id: number, chat_id: number) {
    return await this.bot.editMessageText(newMessage, {
      message_id: message_id,
      chat_id: chat_id,
    });
  }
  async replyMessage(message: string, chat_id: number) {
    return await this.bot.sendMessage(message, {
      chat_id: chat_id,
    });
  }
  async sendQuizSetupMessage(chat_id: number) {
    const message = '';
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "1. I'm in!", callback_data: 'im_in' }],
          [{ text: '2. Questions Timer', callback_data: 'timer' }],
          [{ text: '3. Questions Category', callback_data: 'category' }],
          [{ text: '4. Number of Questions', callback_data: 'num_questions' }],
          [{ text: '5. Start Quiz', callback_data: 'start_quiz' }],
        ],
      },
    };

    return await this.sendMessage(message, options);
  }

  private initBot() {}
}
