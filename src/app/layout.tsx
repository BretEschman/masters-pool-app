import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Master's Pool",
  description: "Annual Master's Golf Pool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-[var(--masters-green)] text-white py-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold tracking-wide">
              Master&apos;s Pool
            </a>
            <a href="/admin" className="text-sm opacity-75 hover:opacity-100">
              Admin
            </a>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
