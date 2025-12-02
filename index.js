// ƏSAS RANDEVU ALMA – YENİ ÇEVİK REGEX
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text || text.startsWith('/')) return;

  // Çox çevik regex – istənilən qədər boşluq və böyük/kiçik hərf qəbul edir
  const regex = /^(\w+)\s+(.+?)\s+saat\s+(\d{1,2})[.:]?(\d{2})$/i;
  const match = text.match(regex);

  if (!match) {
    return bot.sendMessage(chatId, 
`❌ Yanlış format!

✅ Doğru nümunələr:
Vusal 10 dekabr saat 16:00
Rəşad 5 yanvar saat 14:30
Emin 25 dekabr saat 09:30`);
  }

  let ad     = match[1].trim();
  let tarix  = match[2].trim();
  let hour   = match[3];
  let minute = match[4];

  // Saat formatını düzəldirik (09 → 9, 016 → 16 və s.)
  hour   = String(parseInt(hour));
  minute = minute.padStart(2, '0');
  const saat = `${hour.padStart(2,'0')}:${minute}`;

  // Yalnız 00 və 30 dəqiqə
  if (!['00','30'].includes(minute)) {
    return bot.sendMessage(chatId, '❌ Yalnız 00 və 30 dəqiqə qəbul olunur!\nMəsələn: 16:00 və ya 16:30');
  }

  const key = `${tarix} ${saat}`;

  if (bookings.has(key)) {
    return bot.sendMessage(chatId, 
`❌ Bu saat DOLUDUR!\n${tarix} — ${saat}\n\nBoş saatları görmək üçün yaz:\n/bosvaxtlar ${tarix}`);
  }

  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad, tarix, saat })
    });

    bookings.set(key, ad);

    await bot.sendMessage(BERBER_ID, 
`YENİ RANDEVU!\n\n${ad}\n${tarix}\n${saat}`);

    await bot.sendMessage(chatId, 
`${ad} qardaş!\n\n${tarix}\n${saat}\n\nQEYD OLUNDU!\nGözləyirik səni ✂️`);

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, '❌ Xəta oldu, 1 dəqiqə sonra yenidən cəhd et');
  }
});
