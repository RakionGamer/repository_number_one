import './globals.css'

export const metadata = {
  title: 'OCR Next + Cloudinary',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
