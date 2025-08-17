import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import cloudinary from 'cloudinary';
import { createImageWithRates } from '../../../lib/imageProcessor.js';

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

export async function POST(req) {
  try {
    const body = await req.json();
    const chatId = body.message?.chat?.id;
    
    if (body.message?.text) {
      await bot.sendMessage(chatId, "👋 Hola! Envíame una imagen y te extraigo las tasas.");
    }
    
    if (body.message?.photo) {
      // Enviar mensaje de espera
      await bot.sendMessage(chatId, "⏳ Procesando imagen... Por favor espera.");
      
      const fileId = body.message.photo.pop().file_id;
      const fileUrl = await getFileUrl(fileId);

      // Descargar imagen de Telegram y subirla a Cloudinary
      const imageBuffer = await downloadImageFromTelegram(fileUrl);
      const cloudinaryUrl = await uploadToCloudinary(imageBuffer);

      // Usar la URL de Cloudinary para OCR
      const res = await fetch(`http://mp-tasas.vercel.app/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cloudinaryUrl }),
      });

      const data = await res.json();
      
      if (data.numeros) {
        const processedImageUrl = await createImageWithRates(data);
        
        await bot.sendPhoto(chatId, processedImageUrl, {
          caption: '📊 Tasas de cambio actualizadas'
        });
        
      } else {
        await bot.sendMessage(chatId, "❌ No se pudieron extraer las tasas de la imagen.");
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Bot error:", err);
    return new Response("error", { status: 500 });
  }
}

async function getFileUrl(fileId) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await res.json();
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

async function downloadImageFromTelegram(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Error descargando imagen: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function uploadToCloudinary(imageBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { 
        folder: 'telegram_bot_images',
        resource_type: 'image',
        format: 'jpg' // Forzar formato JPG para mejor compatibilidad con OCR
      }, 
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(imageBuffer);
  });
}