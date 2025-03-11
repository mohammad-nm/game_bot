import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

interface Quiz {
  user_id: number; //who created the quiz
  message_id: number; //message id of the quiz setup message
  chat_id: number; //chat id of the quiz setup message
  timer: string; //timer of the quiz
  category: string; //category of the quiz
  number_of_questions: string; //number of questions of the quiz
  participants: Array<Participant>; //participants of the quiz
}

interface Participant {
  user_id: number; //user id of the participant
  username: string; //username of the participant
  score: number; //score of the participant
}
interface Question {
  question: string;
  answers: Array<string>;
  correctAnswer: string;
}
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
    await this.telegramBot.editMessageText(newMessage, {
      message_id: message_id,
      chat_id: chat_id,
      reply_markup: reply_markup,
    });
    return;
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
  async sendQuizSetupMessage(chat_id: number, username: string) {
    const message = `This quiz has been created by: 🙍${username} 

Choose from options below to set up your quiz:

🙋Press "I'm in!" to join.
⚙️Adjust quiz settings like timer, category, or number of questions.
🚀Press "Start Quiz" when everyone is ready.

Participants: 
🙍${username}
`;
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
            { text: 'JS ✅', callback_data: 'JS' },
            { text: 'TS', callback_data: 'TS' },
            { text: 'React', callback_data: 'React' },
            { text: 'Next.js', callback_data: 'Next.js' },
            { text: 'Node.js', callback_data: 'Node.js' },
          ],
          [{ text: 'Start Quiz ➡️', callback_data: 'start_quiz' }],
        ],
      },
    };

    return await this.sendMessage(chat_id, message, options);
  }
  async updateQuizSetupMessage(
    message_id: number,
    chat_id: number,
    username: string,
  ) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    const message = `Hi!
This quiz has been created by: 🙍${username}

Choose from options below to set up your quiz:

🙋Press "I'm in!" to join.
⚙️Adjust quiz settings like timer, category, or number of questions.
🚀Press "Start Quiz" when everyone is ready.

Participants: 
🙍${quiz.participants.map((p) => p.username).join('\n' + '🙋')}
`;
    const reply_markup = {
      inline_keyboard: [
        [{ text: "I'm in! 🔽", callback_data: 'im_in' }],
        [
          {
            text: '5s' + (quiz.timer === '5s' ? ' ✅' : ''),
            callback_data: '5s',
          },
          {
            text: '10s' + (quiz.timer === '10s' ? ' ✅' : ''),
            callback_data: '10s',
          },
          {
            text: '15s' + (quiz.timer === '15s' ? ' ✅' : ''),
            callback_data: '15s',
          },
        ],
        [
          {
            text:
              '5 questions' + (quiz.number_of_questions === '5q' ? ' ✅' : ''),
            callback_data: '5q',
          },
          {
            text:
              '10 questions' +
              (quiz.number_of_questions === '10q' ? ' ✅' : ''),
            callback_data: '10q',
          },
          {
            text:
              '15 questions' +
              (quiz.number_of_questions === '15q' ? ' ✅' : ''),
            callback_data: '15q',
          },
        ],
        [
          {
            text: 'JS' + (quiz.category === 'JS' ? ' ✅' : ''),
            callback_data: 'JS',
          },
          {
            text: 'TS' + (quiz.category === 'TS' ? ' ✅' : ''),
            callback_data: 'TS',
          },
          {
            text: 'React' + (quiz.category === 'React' ? ' ✅' : ''),
            callback_data: 'React',
          },
          {
            text: 'Next.js' + (quiz.category === 'Next.js' ? ' ✅' : ''),
            callback_data: 'Next.js',
          },
          {
            text: 'Node.js' + (quiz.category === 'Node.js' ? ' ✅' : ''),
            callback_data: 'Node.js',
          },
        ],
        [{ text: 'Start Quiz ➡️', callback_data: 'start_quiz' }],
      ],
    };
    return await this.editMessage(message, message_id, chat_id, reply_markup);
  }
  async newQuizRedis(
    user_id: number,
    username: string,
    message_id: number,
    chat_id: number,
  ) {
    //message id will be +1 when i get callback query so i need to add 1 to this to match with the key
    const quizKey = `Quiz:${message_id + 1}${chat_id}`;
    const quizData: Quiz = {
      user_id: user_id,
      message_id: message_id,
      chat_id: chat_id,
      timer: '10s',
      category: 'JS',
      number_of_questions: '10q',
      participants: [{ user_id: user_id, username: username, score: 0 }],
    };
    await this.redis.set(quizKey, JSON.stringify(quizData));
  }
  async changeQuizTimer(
    user_id: number,
    message_id: number,
    chat_id: number,
    timer: string,
    username: string,
  ) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData: string | null = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    console.log(quiz);
    if (user_id !== quiz.user_id)
      return { error: 'Only the quiz creator can change the timer' };
    quiz.timer = timer;
    await this.redis.set(quizKey, JSON.stringify(quiz));
    await this.updateQuizSetupMessage(message_id, chat_id, username);
    return { success: 'Timer changed successfully' };
  }
  async changeQuizNumberOfQuestions(
    user_id: number,
    message_id: number,
    chat_id: number,
    number_of_questions: string,
    username: string,
  ) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData: string | null = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    if (user_id !== quiz.user_id)
      return {
        error: 'Only the quiz creator can change the number of questions',
      };
    quiz.number_of_questions = number_of_questions;
    await this.redis.set(quizKey, JSON.stringify(quiz));

    await this.updateQuizSetupMessage(message_id, chat_id, username);
    return { success: 'Number of questions changed successfully' };
  }
  async changeQuizCategory(
    user_id: number,
    message_id: number,
    chat_id: number,
    category: string,
    username: string,
  ) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData: string | null = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    if (user_id !== quiz.user_id)
      return { error: ' Only the quiz creator can change the category' };
    quiz.category = category;
    await this.redis.set(quizKey, JSON.stringify(quiz));
    await this.updateQuizSetupMessage(message_id, chat_id, username);
    return { success: 'Category changed successfully' };
  }

  async addToQuizParticipants(
    message_id: number,
    chat_id: number,
    participant: Participant,
    username: string,
  ) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    if (quiz.participants.map((p) => p.user_id).includes(participant.user_id)) {
      return { error: 'You have already joined this quiz' };
    }
    quiz.participants.push(participant);
    console.log('quiz:', quiz);
    await this.redis.set(quizKey, JSON.stringify(quiz));
    await this.updateQuizSetupMessage(message_id, chat_id, username);
    return { success: 'Participant added successfully' };
  }
  async startQuiz(user_id: number, message_id: number, chat_id: number) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const quizData = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(quizData as string);
    if (!quiz) return { error: 'No quiz found' };
    if (user_id !== quiz.user_id)
      return { error: 'Only the quiz creator can start the quiz' };
    const participants: Participant[] = quiz.participants.map((p) => p);
    console.log('quiz:', quiz);
    console.log('participants:', participants);
    const questions: Question[] = [
      {
        question: '1What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '2What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '3What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '4What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '5What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '6What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '7What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '8What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
      {
        question: '9What is the answer?',
        answers: ['aaa', 'bbb', 'ccc'],
        correctAnswer: 'aaa',
      },
    ]; //TODO: get questions from redis based on the category
    for (let i = 0; i < questions.length; i++) {
      const newMessage = `⏳Timer: ${quiz.timer}
🔍Category: ${quiz.category}
🔢Number of Questions: ${quiz.number_of_questions}
🏁Participants:
${quiz.participants.map((p) => `🙍${p.username}: ${p.score}`).join('\n')}

⁉️Question${i + 1}/${questions.length}: 
${questions[i].question}

${questions[i].answers
  .map(
    (a, index) => `${index + 1}. ${a}
      `,
  )
  .join('\n')}
    `;
      const reply_markup = {
        inline_keyboard: [
          ...questions[i].answers.map((a, index) => [
            {
              text: `${index + 1}`,
              callback_data: `${a}`,
            },
          ]),
        ],
      };
      console.log('newMessage:', newMessage);
      console.log('reply_markup:', reply_markup);
      await this.editMessage(newMessage, message_id, chat_id, reply_markup);
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          { '5s': 5000, '10s': 10000, '15s': 15000 }[quiz.timer] || 15000,
        ),
      );
    }
  }
  async updateQuizMessageByRedisData(message_id: number, chat_id: number) {
    const quizKey = `Quiz:${message_id}${chat_id}`;
    const savedQuiz = await this.redis.get(quizKey);
    const quiz: Quiz = JSON.parse(savedQuiz as string);
    if (!quiz) return { error: 'No quiz found' };

    console.log('savedQuiz:', JSON.parse(savedQuiz as string));
  }

  private initBot() {
    console.log('Telegram bot initialized and listening for messages...');
    const bot: TelegramBot = this.telegramBot;

    bot.on('/start', async (msg) => {
      this.sendMessage(
        msg.chat.id,
        "Hi, I'm game80_bot. I'm here to help you with your game development needs. Just send me a message and I'll do my best to assist you.",
      );
    });

    bot.on('message', async (msg) => {
      const isMentioned: boolean = this.isMentioned(msg);
      const messageText: string = msg.text;
      const message_id: number = msg.message_id;
      const chat_id: number = msg.chat.id;
      const user_id: number = msg.from.id;
      const username: string = msg.from.username;
      //   console.log('isMentioned:', isMentioned);
      //   console.log(`Received message: ${msg.text} from ${msg.chat.id}`);
      //   console.log('Message object:', msg);
      console.log('received message:', message_id, chat_id);
      if (isMentioned) {
        await this.newQuizRedis(user_id, username, message_id, chat_id);
        await this.sendQuizSetupMessage(chat_id, username);
      }
    });

    bot.on('callback_query', async (query) => {
      const callbackData: string = query.data;
      const user_id: number = query.from.id;
      const message_id: number = query.message.message_id;
      const chat_id: number = query.message.chat.id;
      const username: string = query.from.username;
      //   console.log('Received callback query:', callbackData);
      console.log('Query object:', query);
      console.log(
        'received callback query:',
        callbackData,
        message_id,
        chat_id,
      );
      switch (callbackData) {
        case 'im_in':
          await this.addToQuizParticipants(
            message_id,
            chat_id,
            {
              user_id: user_id,
              username: username,
              score: 0,
            },
            username,
          );

          break;
        case '5s':
        case '10s':
        case '15s':
          const changeTimer = await this.changeQuizTimer(
            user_id,
            message_id,
            chat_id,
            callbackData,
            username,
          );
          if (changeTimer.error) {
            this.sendMessage(chat_id, changeTimer.error);
          }

          break;

        case '5q':
        case '10q':
        case '15q':
          const changeNumberOfQuestions =
            await this.changeQuizNumberOfQuestions(
              user_id,
              message_id,
              chat_id,
              callbackData,
              username,
            );
          if (changeNumberOfQuestions.error) {
            this.sendMessage(chat_id, changeNumberOfQuestions.error);
          }
          break;
        case 'JS':
        case 'TS':
        case 'React':
        case 'Next.js':
        case 'Node.js':
          const changeCaegory = await this.changeQuizCategory(
            user_id,
            message_id,
            chat_id,
            callbackData,
            username,
          );
          if (changeCaegory.error) {
            await this.sendMessage(chat_id, changeCaegory.error);
          }

          break;
        case 'start_quiz':
          await this.startQuiz(user_id, message_id, chat_id);
          break;
      }
    });
  }
}
