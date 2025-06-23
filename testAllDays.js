const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = '8156662218:AAGX2byCYEChetgRx-gRNZzewVPaNvoO9Gs';
const CHAT_ID = '441585403';
const API_URL = 'https://simplifica.madeira.gov.pt/api/resources/intervals';

const COURTS = [127, 128, 130];
const processId = 32;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const STATE_PATH = path.resolve(__dirname, 'last.json');

// Получаем 7 дней вперёд
function getNext7Days() {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      key: d.toISOString().slice(0, 10)
    };
  });
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

async function fetchDayData(courtId, year, month, day) {
  const payload = {
    resourceId: String(courtId),
    year,
    month,
    day,
    processId
  };

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://simplifica.madeira.gov.pt',
    'Referer': 'https://simplifica.madeira.gov.pt/services/3-53-102',
    'User-Agent': 'Mozilla/5.0',
    'X-XSRF-TOKEN': 'eyJpdiI6Ik1qZGkwNm9aa2Flczl3ZHREQndqTFE9PSIsInZhbHVlIjoiaVl1MnIrOXdpb25NMTFGbHVMZ1kvNlg3dHB6eWkwcVBaVFR6TW42dCtyRUlpUGJ4ZGNuTnJ2bm9ydUNlTFZybk9xd1l4WlgrMlNJWmo5d3JnR2swSmR5ejU3RnVUaHFFUmNxdGVjZXJHQ2Iwd1E3ekVRWXZDVFRuaXlSSnJJemYiLCJtYWMiOiI5MjFhMThmZWUyMWQ4ZTZkM2IzMDBjZmU4MGEzMGY1ODUzODU0ZjA2N2E3ZjQwYzYyMmNmYmRhOTU0ZjU1Y2Q3IiwidGFnIjoiIn0=',
    'Cookie': 'XSRF-TOKEN=eyJpdiI6Ik1qZGkwNm9aa2Flczl3ZHREQndqTFE9PSIsInZhbHVlIjoiaVl1MnIrOXdpb25NMTFGbHVMZ1kvNlg3dHB6eWkwcVBaVFR6TW42dCtyRUlpUGJ4ZGNuTnJ2bm9ydUNlTFZybk9xd1l4WlgrMlNJWmo5d3JnR2swSmR5ejU3RnVUaHFFUmNxdGVjZXJHQ2Iwd1E3ekVRWXZDVFRuaXlSSnJJemYiLCJtYWMiOiI5MjFhMThmZWUyMWQ4ZTZkM2IzMDBjZmU4MGEzMGY1ODUzODU0ZjA2N2E3ZjQwYzYyMmNmYmRhOTU0ZjU1Y2Q3IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6Im9IT3B0elRzWE1SNmRVa1B4dlR2WUE9PSIsInZhbHVlIjoiTmIyNWVNVDJGZzZHSTVtY3BHekc1bzFLS0F4NFpvZ080aFJxWVRMcDVZQ09EL2orVzBLL3FsVWlNUXNJNU5xOUJlQzMzMXdVME9xQlVjSHR6SXdablY3LytJRFhHRFo4NlpTeE9La1ZvRHJscnVRU2xrd2JTZEpkSzlUS0VOaVciLCJtYWMiOiIzZTU5ZWJiYWM4OTIwMmI3ODM2OWM0NjNiY2UzZDkwNDdjZTVmZDNiZWYyMThlNTNhNTNiMTFkNDI1ZTk3NTMyIiwidGFnIjoiIn0%3D' // <-- вставь реальные куки и токен как в тесте
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Ошибка: ' + response.status);
  return response.json();
}

function findNewlyBookedSlots(current, previous = []) {
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

function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    return JSON.parse(fs.readFileSync(STATE_PATH));
  }
  return {};
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function checkCourtDay(courtId, dateObj, globalState) {
  const { year, month, day, key } = dateObj;

  try {
    const currentData = await fetchDayData(courtId, year, month, day);
    const current = currentData.data || [];

    const previous = globalState[courtId]?.[key] || [];

    const changes = findNewlyBookedSlots(current, previous);

    if (changes.length > 0) {
      let msg = `🎾 Занялись слоты на корте #${courtId} (${key}):\n`;
      changes.forEach(s => {
        msg += `🕒 ${formatDateTime(s.start)} – ${formatDateTime(s.end)}\n`;
      });
      await bot.sendMessage(CHAT_ID, msg);
    } else {
      console.log(`Нет изменений: корт ${courtId}, дата ${key}`);
    }

    if (!globalState[courtId]) globalState[courtId] = {};
    globalState[courtId][key] = current;

  } catch (err) {
    console.error(`❌ Ошибка на корте ${courtId} ${key}:`, err.message);
  }
}

async function runAll() {
  const dates = getNext7Days();
  const state = loadState();

  for (const courtId of COURTS) {
    for (const dateObj of dates) {
      await checkCourtDay(courtId, dateObj, state);
    }
  }

  saveState(state);
}

runAll();
setInterval(runAll, 30 * 60 * 1000);
