import { createCanvas, loadImage } from 'canvas';
import cloudinary from 'cloudinary';

const coordinates = {
    fecha: { x: 300, y: 250 },      // Fecha: top-left
    hora: { x: 215, y: 325 },       // Hora: debajo de fecha
    chile: { x: 425, y: 431 },     // Chile: cuadro verde derecha
    pagoMovil: { x: 479, y: 500 }, // Pago Móvil: cuadro verde derecha
    peru: { x: 429, y: 623 },      // Perú: cuadro verde derecha
    colombia: { x: 459, y: 790 },  // Colombia: cuadro verde derecha
    argentina: { x: 421, y: 960 }, // Argentina: cuadro verde derecha
    mexico: { x: 421, y: 1140 },    // México: cuadro verde derecha




    usa: { x: 1155, y: 460 },       // USA: cuadro verde derecha (columna 2)
    panama: { x: 1155, y: 639 },    // Panamá: cuadro verde derecha (columna 2)
    brasil: { x: 1155, y: 795 },    // Brasil: cuadro verde derecha (columna 2)
    espana: { x: 1155, y: 965 }     // España: cuadro verde derecha (columna 2)
};

const baseImageUrl = 'https://i.ibb.co/VYbYjmD2/Dise-os-MULTIPOWER.jpg';

export async function createImageWithRates(extractedData) {
    try {
        // Cargar la imagen base
        const baseImage = await loadImage(baseImageUrl);
        
        // Crear canvas con las dimensiones de la imagen base
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext('2d');
        
        // Dibujar la imagen base
        ctx.drawImage(baseImage, 0, 0);
        
        // Configurar el estilo del texto base
        ctx.fillStyle = '#FFFFFF';        // Texto blanco
        ctx.strokeStyle = '#000000';      // Contorno negro
        ctx.lineWidth = 3;                // Contorno más grueso para más negrita
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Tamaños personalizados por país/campo
        const customSizes = {
            fecha: 40,
            hora: 40,
            chile: 48,
            pagoMovil: 48,
            peru: 54,        // Perú más grande
            colombia: 52,
            argentina: 48,
            mexico: 52,
            usa: 52,
            panama: 52,
            brasil: 52,
            espana: 52
        };
        
        // Función helper para dibujar texto con contorno personalizable
        const drawTextWithStroke = (text, x, y, fontSize = 48, strokeWidth = 4) => {
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        };
        
        // Extraer los datos
        const { numeros } = extractedData;
        
        // Formatear y colocar la fecha
        if (numeros.fecha && numeros.fecha.dia && numeros.fecha.mes) {
            const fechaTexto = `${numeros.fecha.dia}/${numeros.fecha.mes}/${numeros.fecha.anio || '2025'}`;
            drawTextWithStroke(fechaTexto, coordinates.fecha.x, coordinates.fecha.y, customSizes.fecha);
        }
        
        // Formatear y colocar la hora
        if (numeros.fecha && numeros.fecha.hora && numeros.fecha.minutos) {
            const horaTexto = `${numeros.fecha.hora}:${String(numeros.fecha.minutos).padStart(2, '0')}`;
            drawTextWithStroke(horaTexto, coordinates.hora.x, coordinates.hora.y, customSizes.hora);
        }
        
        // Colocar las tasas de cambio
        const tasasMapping = {
            chile: numeros.tasaChile,
            peru: numeros.tasaPeru,
            colombia: numeros.tasaColombia,
            argentina: numeros.tasaArgentina || 'Consultar',
            mexico: numeros.tasaMexico,
            usa: numeros.tasaUSA,
            panama: numeros.tasaPanama,
            brasil: numeros.tasaBrasil,
            espana: numeros.tasaEspaña
        };
        
        // Función para calcular tasa de compra (resta 0.00030 a Chile)
        const calcularTasaCompra = (tasaVenta) => {
            if (!tasaVenta) return null;
            
            // Convertir de formato "0,18370" a número decimal
            const numeroDecimal = parseFloat(tasaVenta.replace(',', '.'));
            
            // Hacer la resta
            const tasaCompra = numeroDecimal - 0.00030;
            
            // Convertir de vuelta al formato original con coma
            return tasaCompra.toFixed(5).replace('.', ',');
        };
        
        // Calcular la tasa de Pago Móvil (tasa de compra de Chile)
        const tasaPagoMovil = calcularTasaCompra(numeros.tasaChile);
        
        // Dibujar cada tasa en su posición con contorno y tamaño personalizado
        Object.entries(tasasMapping).forEach(([pais, tasa]) => {
            if (tasa && coordinates[pais]) {
                const fontSize = customSizes[pais] || 48; // Default 48px
                const strokeWidth = pais === 'peru' ? 4 : 3; // Perú con borde más grueso
                drawTextWithStroke(tasa, coordinates[pais].x, coordinates[pais].y, fontSize, strokeWidth);
            }
        });
        
        // Dibujar la tasa de Pago Móvil si existe
        if (tasaPagoMovil && coordinates.pagoMovil) {
            drawTextWithStroke(tasaPagoMovil, coordinates.pagoMovil.x, coordinates.pagoMovil.y, customSizes.pagoMovil);
        }
        
        // Convertir canvas a buffer
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
        
        // Subir la imagen procesada a Cloudinary
        return new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
                { 
                    folder: 'processed_rates_images',
                    resource_type: 'image',
                    format: 'jpg',
                    public_id: `rates_${Date.now()}`
                }, 
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            stream.end(buffer);
        });
        
    } catch (error) {
        console.error('Error procesando imagen:', error);
        throw error;
    }
}