import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8053119867:AAG1vVTjrgAUlj0DTYeGKfYzDthLXmHNt2I";
const OCR_API_URL = process.env.OCR_API_URL || "http://localhost:3000/api/ocr"; // tu Next.js

// Crear el bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Si no hay foto → ignorar
  if (!msg.photo) {
    bot.sendMessage(chatId, "📸 Por favor envíame una imagen de las tasas.");
    return;
  }

  try {
    // Telegram envía varias resoluciones → tomamos la más grande
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);

    // Construir URL pública para descargar la foto
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

    // Llamar a tu API OCR en Next.js
    const res = await fetch(OCR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: fileUrl })
    });

    if (!res.ok) throw new Error("Error en OCR API");

    const data = await res.json();

    // Formatear respuesta
    const tasas = `
💱 Tasas detectadas:
🇨🇱 Chile: ${data.tasaChile}
🇵🇪 Perú: ${data.tasaPeru}
🇨🇴 Colombia: ${data.tasaColombia}
🇪🇸 España: ${data.tasaEspaña}
🇺🇸 USA: ${data.tasaUSA}
🇲🇽 México: ${data.tasaMexico}
🇧🇷 Brasil: ${data.tasaBrasil}
🇵🇦 Panamá: ${data.tasaPanama}

📅 Fecha: ${data.fecha.dia}/${data.fecha.mes}/${data.fecha.anio} ${data.fecha.hora}:${data.fecha.minutos}
    `;

    bot.sendMessage(chatId, tasas.trim());
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Hubo un error procesando la imagen.");
  }
});
