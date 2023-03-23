const TelegramBot = require('node-telegram-bot-api');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const creds = require('./credentials.json')
const { token } = require('./env.js')

const bot = new TelegramBot(token, {
  polling: true
})

// -----------------------------

async function auth(chatId, people) {
  const doc = new GoogleSpreadsheet('1KtsnOhkxKJV4K7nmIyPOAhd2DB7VeJjirodtTJbKRqM');

  await doc.useServiceAccountAuth(creds)

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();

  // Проверка на наличие зарегистрированного пользователя по ТГ
  const isRegister = rows.some((row) => {
    return row.Телеграм == people.Телеграм
  })

  if(isRegister) {
    await bot.sendMessage(chatId, `Телаграм с ником ${people.Телеграм} уже был зарегистрирован.\nЕсли вы случайно записали не те данные, то пишите нам в личку`);
  } else {
    addParticipant(sheet, people)
    await bot.sendMessage(chatId, "Вы записаны :)")
  }
}

async function addParticipant(sheet, people) {
   await sheet.addRow(people)
}
// ----------------------------

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/start") {
    await bot.sendMessage(chatId, "Добро пожаловать, " + msg.from.first_name);
    await bot.sendMessage(chatId, "Данное мероприятие пройдет 1 апреля в 18:00 там будет проходить вечеринка в честь старых чб фильмов", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Дальше',
              callback_data: '/next'
            }
          ]
        ]
      }
    });
  }

  if (msg.text === "/info") {
    await bot.sendMessage(chatId, "Что вам хотелось бы узнать?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Зарегистрироваться',
              callback_data: '/register'
            }
          ],
          [
            {
              text: 'Местоположение и контакты',
              callback_data: '/contacts'
            }
          ],
          [
            {
              text: 'Дресс код',
              callback_data: '/clothers'
            }
          ],
          [
            {
              text: 'Списки гостей',
              callback_data: '/guests'
            }
          ]
        ]
      }
    });
  }
})

bot.onText(/\/party (.+)/, async (msg, arr) => {
  const chatId = msg.chat.id;
  const tgUsername = msg.from.username;
  const info = arr[1].split(" ")
  if (info.length === 3) {
    auth(chatId, {Имя: info[0],Фамилия: info[1],Телефон: info[2],Телеграм: tgUsername})
  } else if(info.length === 1) {
    auth(chatId, {Имя: msg.from.first_name,Фамилия: msg.from.last_name,Телефон: info[0],Телеграм: tgUsername})
  } else {
    await bot.sendMessage(chatId, "Я вас не понял попробуйте еще раз")
    return
  }
})

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data == "/next") {
    await bot.sendMessage(chatId, "Что вам хотелось бы узнать?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Зарегистрироваться',
              callback_data: '/register'
            }
          ],
          [
            {
              text: 'Местоположение и контакты',
              callback_data: '/contacts'
            }
          ],
          [
            {
              text: 'Дресс код',
              callback_data: '/clothers'
            }
          ],
          [
            {
              text: 'Списки гостей',
              callback_data: '/guests'
            }
          ]
        ]
      }
    });
  }

  if (query.data == "/register") {
    await bot.sendMessage(chatId, `Желаете ли вы, чтобы мы использовали ваши данные из профиля телеграмм для регистрации на мероприятие, а именно ваше имя ${query.from.first_name}, а также фамилию ${query.from.last_name}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Да',
              callback_data: '/registerYes'
            },
            {
              text: 'Нет',
              callback_data: '/registerNo'
            }
          ]
        ]
      }
    });
  }

  if (query.data == "/contacts") {
    await bot.sendMessage(chatId, 'Место нахождение мероприятия начало, которого в 18:00')
    await bot.sendLocation(chatId, 59.967520, 30.293410)
    await bot.sendMessage(chatId, 'При проблемах и всех волнующих вопросах писать сюда')
    await bot.sendContact(chatId, '89108405702', 'AnpanmanF')
  }

  if (query.data == "/clothers") {
    await bot.sendMessage(chatId, "Это будет черно-белая вечеринка в стиле чб фильмов и все гостей хотелось бы увидеть в элегантных костюмах и платьях.\nКак пример")
    await bot.sendPhoto(chatId, 'https://fiestino.ru/wp-content/uploads/_pu/0/02593519.jpg')
  }

  if (query.data == "/guests") {
    await bot.sendMessage(chatId, "Списки гостей\nhttps://docs.google.com/spreadsheets/d/1I0YjzcUkFshW9BGxTPZnB5Tel7oPZ9kEWpR9Ck4lDR0/edit?usp=sharing")
  }

  if (query.data == "/registerYes") {
    await bot.sendMessage(chatId, "Отправьте команду с номером своего телефона\n/party Телефон")
    await bot.sendMessage(chatId, "Пример: /party 89108405702")
  }

  if (query.data == "/registerNo") {
    await bot.sendMessage(chatId, "Отправьте команду со свойствами\n/party Имя Фамилия Телефон")
    await bot.sendMessage(chatId, "Пример: /party Алексей Кондратьев 89108405702")
  }
})

