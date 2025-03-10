import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class TelegramService {
  private telegramBot: TelegramBot;
  private readonly botUsername: string = 'game80_bot';
  constructor(
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    const BOT_TOKEN: string | undefined =
      this.configService.get<string>('BOT_TOKEN');
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not set');
    }
    this.telegramBot = new TelegramBot(BOT_TOKEN, { polling: true });
    this.initBot();
  }
  async sendMessage(
    chat_id: string | number,
    message: string | number,
    options?: object,
  ) {
    console.log(`Sending message to ${chat_id}: ${message}`);
    return await this.telegramBot.sendMessage(chat_id, message, options);
  }
  async editMessage(
    newMessage: string,
    message_id: number,
    chat_id: number,
    reply_markup?: object,
  ) {
    return await this.telegramBot.editMessageText(newMessage, {
      message_id: message_id,
      chat_id: chat_id,
      reply_markup: reply_markup,
    });
  }
  async replyMessage(message: string, message_id: number, chat_id: number) {
    return await this.sendMessage(chat_id, message, {
      chat_id: chat_id,
      reply_parameters: {
        message_id,
      },
    });
  }
  isMentioned(msg: TelegramBot.Message): boolean {
    if (msg.entities && msg.text) {
      let isMentioned: boolean = false;
      msg.entities.map((entity) => {
        if (entity.type === 'mention') {
          const mentionText: string = msg.text.substring(
            entity.offset,
            entity.offset + entity.length,
          );
          if (
            mentionText.toLowerCase() === `@${this.botUsername.toLowerCase()}`
          ) {
            isMentioned = true;
          }
        }
      });
      return isMentioned;
    } else {
      return false;
    }
  }
  async sendQuizSetupMessage(chat_id: number) {
    const message = `Hi! Choose an option below to set up your quiz:
- Press "I'm in!" to join.
- Adjust quiz settings like timer, category, or number of questions.
- Press "Start Quiz" when you're ready.`;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "I'm in! 🔽", callback_data: 'im_in' }],
          [
            { text: '5s', callback_data: '5s' },
            { text: '10s ✅', callback_data: '10s' },
            { text: '15s', callback_data: '15s' },
          ],
          [
            { text: '5 questions', callback_data: '5q' },
            { text: '10 questions ✅', callback_data: '10q' },
            { text: '15 questions', callback_data: '15q' },
          ],
          [
            { text: 'JS ✅', callback_data: 'js' },
            { text: 'TS', callback_data: 'ts' },
            { text: 'React', callback_data: 'react' },
            { text: 'Next.js', callback_data: 'next.js' },
            { text: 'Node.js', callback_data: 'node.js' },
          ],
          [{ text: 'Start Quiz ➡️', callback_data: 'start_quiz' }],
        ],
      },
    };

    return await this.sendMessage(chat_id, message, options);
  }
  async newQuizRedis(userId: number, message_id: number, chat_id: number) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData = {
      userId: userId,
      message_id: message_id,
      chat_id: chat_id,
      timer: '10s',
      category: 'js',
      number_of_questions: '10q',
      participants: [{ userId: userId, score: 0 }],
    };
    await this.redis.set(quizKey, JSON.stringify(quizData));
    const savedQuiz = await this.redis.get(`Quiz:${message_id}${chat_id}`);
    console.log('savedQuiz:', JSON.parse(savedQuiz as string));
  }
  async changeQuizTimer(
    message_id: number,
    chat_id: number,
    timer: string,
    userId: number,
  ) {}
  async changeQuizNumberOfQuestions() {}
  async changeQuizCategory() {}
  async addToQuizParticipants() {}

  private initBot() {
    console.log('Telegram bot initialized and listening for messages...');
    const bot: TelegramBot = this.telegramBot;

    bot.on('message', async (msg) => {
      const isMentioned: boolean = this.isMentioned(msg);
      const messageText: string = msg.text;
      const messageId: number = msg.message_id;
      const chatId: number = msg.chat.id;
      const userId: number = msg.from.id;
      console.log('isMentioned:', isMentioned);
      console.log(`Received message: ${msg.text} from ${msg.chat.id}`);
      console.log('Message object:', msg);

      if (messageText === '/start') {
        await this.sendMessage(
          msg.chat.id,
          `Welcome! 🚀
            Add this bot to your group and tag it to start the quiz with your friends!`,
        );
      }
      if (isMentioned) {
        await this.newQuizRedis(userId, messageId, chatId);
        await this.sendQuizSetupMessage(msg.chat.id);
      }
    });

    bot.on('callback_query', async (query) => {
      const callbackData: string = query.data;
      const userId: number = query.from.id;
      const messageId: number = query.message.message_id;
      const chatId: number = query.message.chat.id;
      console.log('Received callback query:', callbackData);
      console.log('Query object:', query);
      switch (callbackData) {
        case 'im_in':
          await this.sendMessage(chatId, 'You are in!');
          break;
        case '5s':
          await this.sendMessage(chatId, '5s');
          break;
        case '10s':
          await this.sendMessage(chatId, '10s');
          break;
        case '15s':
          await this.sendMessage(chatId, '15s');
          break;
        case '5q':
          await this.sendMessage(chatId, '5q');
          break;
        case '10q':
          await this.sendMessage(chatId, '10q');
          break;
        case '15q':
          await this.sendMessage(chatId, '15q');
          break;
        case 'js':
          await this.sendMessage(chatId, 'js');
          break;
        case 'ts':
          await this.sendMessage(chatId, 'ts');
          break;
        case 'react':
          await this.sendMessage(chatId, 'react');
          break;
        case 'next.js':
          await this.sendMessage(chatId, 'next.js');
          break;
        case 'node.js':
          await this.sendMessage(chatId, 'node.js');
          break;
        case 'start_quiz':
          await this.sendMessage(chatId, 'start_quiz');
          break;
      }
    });
  }
}
