'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [publicId, setPublicId] = useState(null);

  const objectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFile = (e) => {
    setError(null);
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    const maxSizeMB = 8;
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo supera ${maxSizeMB} MB.`);
      return;
    }

    setFile(f);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  };

  async function handleUpload(e) {
    e.preventDefault();
    setResult(null);
    setError(null);

    if (!file) return setError('Selecciona una imagen antes de subir.');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      });

      if (!uploadRes.ok) {
        const txt = await uploadRes.text().catch(()=>null);
        throw new Error(txt || 'Error subiendo al servidor');
      }

      const uploadJson = await uploadRes.json();
      const url = uploadJson.secure_url || uploadJson.url || null;
      const pid = uploadJson.public_id || null;

      setUploadedUrl(url);
      setPublicId(pid);

      if (!url) throw new Error('No se obtuvo secure_url de Cloudinary');

      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!ocrRes.ok) {
        const txt = await ocrRes.text().catch(()=>null);
        throw new Error(txt || 'Error en OCR server');
      }

      const data = await ocrRes.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); } catch (e) { console.warn('No se pudo copiar', e); }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-black">Seleccionar imagen</label>
        <input type="file" accept="image/*" onChange={handleFile} className="block text-white bg-blue-700 p-2 w-full rounded-sm pointer cursor-pointer" />
        <p className="text-xs text-gray-500 mt-1">Máx 8MB. Formatos: jpg, png, webp...</p>
      </div>

      {previewUrl && (
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 border rounded overflow-hidden bg-white flex items-center justify-center">
            <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
          </div>
          <div className="text-sm text-gray-600">Vista previa local</div>
        </div>
      )}

      <div>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 cursor-pointer">
          {loading ? 'Procesando...' : 'Subir y extraer'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {uploadedUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="text-black font-semibold">Imagen subida</h3>
          <div className="mt-2 flex gap-4 items-start">
            <div className="w-40 h-40 bg-white rounded overflow-hidden border flex items-center justify-center">
              <img src={uploadedUrl} alt="uploaded" className="object-cover w-full h-full" />
            </div>
            <div className="flex-1 text-sm">
              <div className="mb-1 text-black"><strong>URL:</strong></div>
              <div className="break-all text-xs text-black mb-2">{uploadedUrl}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copyToClipboard(uploadedUrl)} className="text-xs text-blue-600 underline">Copiar URL</button>
                {publicId && (<button type="button" onClick={() => copyToClipboard(publicId)} className="text-xs text-blue-600 underline">Copiar public_id</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-white border rounded">
          <h3 className="font-semibold text-black">Resultado OCR</h3>
          {result.parsedText && (
            <>
              <div className="text-xs text-gray-500 mt-2">Texto parseado</div>
              <pre className="text-xs text-black bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{result.parsedText}</pre>
              <button onClick={() => copyToClipboard(result.parsedText)} className="text-xs text-blue-600 underline mt-1">Copiar texto</button>
            </>
          )}
          {result.textoLimpio && (
            <>
              <div className="text-xs text-black mt-2 ">Texto limpio</div>
              <pre className="text-xs text-black bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{result.textoLimpio}</pre>
            </>
          )}
          {result.numeros && (
            <div className="mt-3">
              <h4 className="font-medium text-black">Tasas</h4>
              <pre className="text-xs text-black bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(result.numeros)}</pre>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
