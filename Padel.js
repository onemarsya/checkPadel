const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = '8156662218:AAGX2byCYEChetgRx-gRNZzewVPaNvoO9Gs'; // замени на свой токен
const CHAT_ID = '441585403'; // замени на свой chat_id
const COURT_URLS = [
  { id: 127, url: 'https://simplifica.madeira.gov.pt/api/infoProcess/32/resources/127/configuration' },
  { id: 128, url: 'https://simplifica.madeira.gov.pt/api/infoProcess/32/resources/128/configuration' },
  { id: 130, url: 'https://simplifica.madeira.gov.pt/api/infoProcess/32/resources/130/configuration' }
];


const stateFilePath = path.resolve(__dirname, 'last.json');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}

function findNewlyBookedSlots(currentData, previousData) {
  const current = currentData.data.intervals;
  const previous = previousData?.data?.intervals || [];

  const newlyBooked = [];

  for (const slot of current) {
    const { begin, end, reservations } = slot;

    const match = previous.find(
      p => p.begin.date === begin.date && p.end.date === end.date
    );

    if (match && match.reservations > 0 && reservations === 0) {
      newlyBooked.push({ start: begin.date, end: end.date });
    }
  }

  return newlyBooked;
}

function formatDateTime(datetimeStr) {
  const date = new Date(datetimeStr);
  return date.toLocaleString('ru-RU', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function checkCourt(courtId, url) {
  const stateFilePath = path.resolve(__dirname, `last_${courtId}.json`);
  try {
    const currentData = await fetchData(url);

    let previousData = null;
    if (fs.existsSync(stateFilePath)) {
      previousData = JSON.parse(fs.readFileSync(stateFilePath));
    }

    const changes = findNewlyBookedSlots(currentData, previousData);

    if (changes.length > 0) {
      let msg = `🎾 Забронированы новые слоты на корте #${courtId}:\n`;
      changes.forEach(s => {
        msg += `🕒 ${formatDateTime(s.start)} – ${formatDateTime(s.end)}\n`;
      });
      await bot.sendMessage(CHAT_ID, msg);
    } 
    else {
    //  await bot.sendMessage(CHAT_ID, '🔄 Никаких изменений – все слоты как были.');
      console.log(`Нет новых бронирований`);
    }

    fs.writeFileSync(stateFilePath, JSON.stringify(currentData, null, 2));

  } catch (err) {
    console.error('Ошибка:', err);
    bot.sendMessage(CHAT_ID, '❌ Произошла ошибка при проверке слотов.');
  }
}

// Запуск единожды для каждого корта
COURT_URLS.forEach(({ id, url }) => {
  checkCourt(id, url);
});