import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  constructor(
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const BOT_TOKEN: string | undefined =
      this.configService.get<string>('BOT_TOKEN');
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set');
    }
    this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
    this.initBot();
  }
  async sendMessage(
    chat_id: string | number,
    message: string | number,
    options?: object,
  ) {
    console.log(`Sending message to ${chat_id}: ${message}`);
    return await this.bot.sendMessage(chat_id, message, options);
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
    const message = `
    Hi choose from the options below to setup your quiz!
    If you want to participate in the quiz hit the I'm in button!
    `;
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

    return await this.sendMessage(chat_id, message, options);
  }

  private initBot() {}
}
