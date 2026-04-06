import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";

export const metadata: Metadata = {
  title: "Master's Pool | EschMetrics",
  description: "Annual Master's Golf Pool — powered by EschMetrics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-[var(--border-medium)] backdrop-blur-xl bg-[var(--bg-primary)]/90">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img
                src="/eschmetrics-mascot.png"
                alt="EschMetrics"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--em-green)] object-cover"
                style={{ objectPosition: 'center 15%' }}
              />
              <span className="text-base sm:text-lg tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="font-black text-[var(--text-primary)]">MASTER&apos;S</span>
                <span className="font-black text-[var(--em-green)]">POOL</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium border-l border-[var(--border-medium)] pl-3 ml-1 hidden lg:block">
                by <span className="font-bold text-[var(--text-secondary)]">ESCH</span><span className="font-bold text-[var(--em-green)]">METRICS</span>
              </span>
            </a>

            <NavWrapper />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-[var(--border-subtle)] mt-12 py-6">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/eschmetrics-mascot.png"
                alt="EschMetrics"
                className="w-5 h-5 rounded-full object-cover opacity-60"
                style={{ objectPosition: 'center 15%' }}
              />
              <span className="text-xs text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text-secondary)]">ESCH</span>
                <span className="font-bold text-[var(--em-green)]">METRICS</span>
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">Master&apos;s Golf Pool</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
