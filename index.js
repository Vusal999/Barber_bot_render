const TelegramBot = require('node-telegram-bot-api');

const TOKEN      = '8541382090:AAEiLEm-G7O5iWm5W42_DYtJLxMsBj10YOQ';
const BERBER_ID  = '6537330813';
const SHEETS_URL = process.env.SHEETS_URL;

const bot = new TelegramBot(TOKEN, { polling: true });
const bookings = new Map();

console.log('BƏRBƏR BOTU 7/24 – RENDER');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `BƏRBƏR RANDENVU BOTU\n\n30 dəqiqə blok\nYalnız :00 və :30\n\nNümunə:\nVusal 10 dekabr saat 16:00\n\nBoş saatlar:\n/bosvaxtlar 10 dekabr`);
});

bot.onText(/\/bosvaxtlar (.+)/i, (msg, match) => {
  const tarix = match[1].trim();
  let text = `Boş/Dolu saatlar — ${tarix}\n\n`;
  for (let h = 9; h <= 21; h++) {
    ['00','30'].forEach(m => {
      const saat = `${h.toString().padStart(2,'0')}:${m}`;
      const key = `${tarix} ${saat}`;
      text += bookings.has(key) ? `❌ ${saat} – ${bookings.get(key)}\n` : `✅ ${saat} – boş\n`;
    });
  }
  bot.sendMessage(msg.chat.id, text);
});

bot.onText(/\/sil (.+)/i, (msg, match) => {
  if (msg.chat.id.toString() !== BERBER_ID) return;
  const parts = match[1].trim().split(' ');
  const saat = parts.pop();
  const ad = parts.shift();
  const tarix = parts.join(' ');
  const key = `${tarix} ${saat}`;
  if (bookings.has(key)) {
    bookings.delete(key);
    bot.sendMessage(BERBER_ID, `${ad} — ${tarix} ${saat} SİLİNDİ`);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text || text.startsWith('/')) return;

  const regex = /^(\w+)\s+([\w\s]+?)\s+saat\s+(\d{1,2}):(\d{2})$/i;
  const match = text.match(regex);
  if (!match) return bot.sendMessage(chatId, `Yanlış format!\nNümunə:\nVusal 10 dekabr saat 16:00`);

  const ad = match[1].trim();
  const tarix = match[2].trim();
  const hour = match[3];
  const minute = match[4];
  const saat = `${hour.padStart(2,'0')}:${minute}`;

  if (!['00','30'].includes(minute)) return bot.sendMessage(chatId, 'Yalnız 00 və 30 dəqiqə!');

  const key = `${tarix} ${saat}`;
  if (bookings.has(key)) return bot.sendMessage(chatId, `Bu saat DOLUDUR!\n${tarix} ${saat}\n\nBoş saatlar: /bosvaxtlar ${tarix}`);

  try {
    await fetch(SHEETS_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ad, tarix, saat}) });
    bookings.set(key, ad);
    await bot.sendMessage(BERBER_ID, `YENİ RANDEVU!\n${ad}\n${tarix}\n${saat}`);
    await bot.sendMessage(chatId, `${ad} qardaş!\n${tarix} ${saat}\nQEYD OLUNDU!\nGözləyirik səni`);
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, 'Xəta oldu, sonra yoxla');
  }
});
