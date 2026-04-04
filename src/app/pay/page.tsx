"use client";

export default function PayPage() {
  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-black tracking-tight mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span className="text-white">PAY</span>
        <span className="text-[var(--em-green)]"> ENTRY</span>
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Pay your $25 entry fee to unlock the leaderboard
      </p>

      <div className="card p-8">
        {/* Amount */}
        <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
          $25
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-8">per entry</p>

        {/* Venmo button */}
        <a
          href="https://venmo.com/u/BretEschman"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#008CFF] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#0074D4] transition-colors mb-4"
        >
          Pay with Venmo
        </a>
        <p className="text-[var(--text-muted)] text-xs mb-6">
          @BretEschman on Venmo
        </p>

        {/* Instructions */}
        <div className="border-t border-[var(--border-medium)] pt-6 text-left">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Instructions</h3>
          <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">1.</span>
              <span>Submit your picks on the <a href="/picks" className="text-[var(--em-green)] hover:underline">picks page</a></span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">2.</span>
              <span>Send <span className="text-white font-semibold">$25</span> to <span className="text-white font-semibold">@BretEschman</span> on Venmo. Apple Pay also accepted for those who insist on being difficult.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">3.</span>
              <span>Include your <span className="text-white font-semibold">pool name</span> in the Venmo note</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">4.</span>
              <span>Once confirmed, the leaderboard unlocks for you</span>
            </li>
          </ol>
        </div>
      </div>

      <p className="text-[var(--text-muted)] text-xs mt-6">
        Multiple entries? Send $25 per entry with each pool name in the note.
      </p>
    </div>
  );
}
