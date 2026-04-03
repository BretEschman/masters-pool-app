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
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-xl bg-[var(--bg-secondary)]/80">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--masters-green)] flex items-center justify-center glow-green">
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>MP</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Master&apos;s Pool
              </span>
            </a>
            <nav className="flex items-center gap-4">
              <a href="/picks" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--masters-yellow)] transition-colors">
                Submit Picks
              </a>
              <a href="/admin" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Admin
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
