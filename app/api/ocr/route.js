// app/api/ocr/route.js
import { NextResponse } from 'next/server';
import { limpiarTextoTasasAvanzado, extraerNumerosAvanzado } from '../../../lib/cleaner';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'No se envió URL' }, { status: 400 });

    const apiKey = process.env.OCR_SPACE_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Falta OCR_SPACE_KEY en env' }, { status: 500 });

    const ocrRes = await fetch(`https://api.ocr.space/parse/imageurl?apikey=${apiKey}&url=${encodeURIComponent(url)}&OCREngine=2`);
    if (!ocrRes.ok) {
      const txt = await ocrRes.text().catch(() => null);
      throw new Error(`OCR.space error: ${txt || ocrRes.status}`);
    }

    const json = await ocrRes.json();
    const parsed = json.ParsedResults?.[0]?.ParsedText || '';
    const textoLimpio = limpiarTextoTasasAvanzado(parsed);
    const numeros = extraerNumerosAvanzado(textoLimpio);

    return NextResponse.json({ parsedText: parsed, textoLimpio, numeros, raw: json });
  } catch (err) {
    console.error('OCR error:', err);
    return NextResponse.json({ error: err.message || 'OCR failed' }, { status: 500 });
  }
}
