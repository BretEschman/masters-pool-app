"use client";

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span className="text-white">POOL</span>
        <span className="text-[var(--em-green)]"> RULES</span>
      </h1>

      <div className="space-y-4">
        {/* Entry */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Entry</h2>
          <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
            <li className="flex gap-3">
              <span className="text-[var(--masters-yellow)] font-bold shrink-0">$25</span>
              <span>Entry fee per roster. Must be paid before the tournament starts to view the leaderboard.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] shrink-0">&#9971;</span>
              <span>Multiple entries are allowed.</span>
            </li>
          </ul>
        </div>

        {/* Roster */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Roster Construction</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Select <span className="text-white font-bold">8 golfers</span> across 6 tiers. Golfers are tiered by their betting odds before the tournament.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { tier: "Tier 1", picks: 2, odds: "4/1 – 30/1", label: "Favorites" },
              { tier: "Tier 2", picks: 2, odds: "30/1 – 40/1", label: "Contenders" },
              { tier: "Tier 3", picks: 1, odds: "45/1 – 66/1", label: "Dark Horses" },
              { tier: "Tier 4", picks: 1, odds: "66/1 – 80/1", label: "Sleepers" },
              { tier: "Tier 5", picks: 1, odds: "90/1 – 120/1", label: "Long Shots" },
              { tier: "Tier 6", picks: 1, odds: "120/1+", label: "Flyers" },
            ].map((t) => (
              <div key={t.tier} className="bg-[var(--bg-surface)] rounded-lg p-3 border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{t.tier}</span>
                  <span className="text-xs font-bold text-[var(--em-green)]">Pick {t.picks}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">{t.odds}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Scoring</h2>
          <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">BEST 4</span>
              <span>Each day, only your <span className="text-white font-semibold">4 best golfer scores</span> count toward your daily total. Your other 4 golfers are dropped for that round.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--em-green)] font-bold shrink-0">TOTAL</span>
              <span>Your total score is the sum of all 4 daily scores across the tournament (Thursday – Sunday).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-400 font-bold shrink-0">+10</span>
              <span>If a golfer <span className="text-white font-semibold">misses the cut</span> or <span className="text-white font-semibold">withdraws</span>, they receive a score of <span className="text-red-400 font-bold">+10</span> for each remaining round they don&apos;t play.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400 font-bold shrink-0">LOW</span>
              <span>This is golf — <span className="text-white font-semibold">lowest total score wins</span>.</span>
            </li>
          </ul>
        </div>

        {/* Tiebreaker */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Tiebreaker</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            When submitting your picks, you&apos;ll predict the <span className="text-white font-semibold">winning golfer&apos;s final tournament score</span> (relative to par, e.g. -11). If two or more participants are tied at the end of the tournament, the tiebreaker goes to whoever predicted <span className="text-white font-semibold">closest to the actual winning score</span> (over or under).
          </p>
        </div>

        {/* Payouts */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Payouts</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Prize pool = total entries &times; $25. Payouts are determined by the pool admin based on the number of entries.
          </p>
        </div>

        {/* Deadline */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--em-green)] uppercase tracking-wider mb-3">Deadline</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            All picks must be submitted <span className="text-white font-semibold">before the first tee time on Thursday</span>. Once the tournament begins, picks are locked and cannot be changed. Check the golfer list before submitting — golfers may withdraw before the tournament starts.
          </p>
        </div>
      </div>

      <div className="text-center mt-8 mb-4">
        <a href="/picks" className="bg-[var(--em-green)] text-black px-8 py-3 rounded-lg font-bold hover:bg-[var(--em-green-dark)] hover:text-white transition-colors inline-block">
          Submit Your Picks
        </a>
      </div>

      <div className="text-center mb-4">
        <a
          href="https://venmo.com/u/BretEschman?txn=pay&amount=5&note=Beer%20for%20the%20dev%20🍺"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--masters-yellow)] transition-colors group"
        >
          <span className="text-3xl group-hover:animate-bounce">🍺</span>
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--masters-yellow)] transition-colors">
            Buy the developer a beer
          </span>
        </a>
      </div>
    </div>
  );
}
