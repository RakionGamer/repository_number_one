// lib/cleaner.js

export function limpiarTextoTasasAvanzado(texto) {
  if (!texto) return '';

  let textoNormalizado = texto
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const patrones = [
    /TASA\s*DEL\s*DIA/gi,
    /BBVA\s*Banesco\s*Mercantile\s*Bank\s*BNC\s*Banco\s*de\s*Venezuela/gi,
    /R\s*PLUS\s*REMESAS/gi,
    /\(\s*oPlusremesas/gi,
    /\b(?:am|AM|pm|PM)\b/g
  ];

  let textoLimpio = textoNormalizado;
  patrones.forEach(patron => {
    textoLimpio = textoLimpio.replace(patron, '');
  });
  textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
  return textoLimpio;
}

export function extraerNumerosAvanzado(textoLimpio) {
  if (!textoLimpio) {
    return {
      tasaChile: null, tasaPeru: null, tasaColombia: null, tasaEspaña: null,
      tasaUSA: null, tasaMexico: null, tasaBrasil: null, tasaPanama: null,
      fecha: { dia: null, mes: null, anio: null, hora: null, minutos: null }
    };
  }

  // Regex flexible para fecha y hora:
  // grupos: 1=dia,2=mes,3=anio(2|4), 4=hora (opcional),5=minutos (opcional), 6=am/pm (opcional)
  const fechaHoraRegex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+Hora\s+(\d{1,2}):(\d{2})(?:\s*(am|pm|AM|PM))?)?/i;
  const fechaMatch = textoLimpio.match(fechaHoraRegex);

  // Quitar la porción de fecha/hora (si existe) antes de extraer números
  let textoSinFecha = textoLimpio.replace(fechaHoraRegex, ' ').replace(/\s+/g, ' ').trim();

  // Regex para números que permite decimales con coma o punto
  const numberRegex = /[0-9]+(?:[.,][0-9]+)*/g;
  const tasas = textoSinFecha.match(numberRegex) || [];

  // Aseguramos 8 posiciones (Chile,Peru,Col,España,USA,Mex,Brasil,Panama)
  const pad = (arr, n) => {
    const out = arr.slice(0, n);
    while (out.length < n) out.push(null);
    return out;
  };
  const t = pad(tasas, 8);

  // Normalizar año de 2 dígitos a 4 (asume 2000+)
  let anioFull = null;
  if (fechaMatch) {
    const anioRaw = fechaMatch[3];
    if (anioRaw.length === 2) {
      const n = Number(anioRaw);
      anioFull = 2000 + n;
    } else {
      anioFull = Number(anioRaw);
    }
  }

  // Hora y minutos (si existen)
  let hora = null, minutos = null;
  if (fechaMatch && fechaMatch[4] !== undefined) {
    hora = fechaMatch[4].padStart(2, '0');
    minutos = fechaMatch[5].padStart(2, '0');
    const ampm = fechaMatch[6];
    if (ampm) {
      let hh = Number(hora);
      if (/pm/i.test(ampm) && hh < 12) hh = hh + 12;
      if (/am/i.test(ampm) && hh === 12) hh = 0;
      hora = String(hh).padStart(2, '0');
    }
  }

  return {
    tasaChile: t[0],
    tasaPeru: t[1],
    tasaColombia: t[2],
    tasaEspaña: t[3],
    tasaUSA: t[4],
    tasaMexico: t[5],
    tasaBrasil: t[6],
    tasaPanama: t[7],
    fecha: {
      dia: fechaMatch?.[1] ?? null,
      mes: fechaMatch?.[2] ?? null,
      anio: anioFull ?? null,
      hora: hora ?? null,
      minutos: minutos ?? null
    }
  };
}
