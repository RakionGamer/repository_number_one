import UploadForm from '../components/UploadForm';

export default function Page() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-4 text-black">Subir imagen para OCR</h1>
      <UploadForm />
    </div>
  );
}
