"use client";

interface Props {
  size?: number;
  className?: string;
}

export default function MastersLogo({ size = 48, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle — dark with green border */}
      <circle cx="60" cy="60" r="58" fill="#0a0a0a" stroke="#22c55e" strokeWidth="2" />
      <circle cx="60" cy="60" r="55" fill="#111111" />

      {/* Augusta-style rolling hills */}
      <path
        d="M10 75 Q25 60 40 68 Q55 76 70 65 Q85 54 100 62 Q108 66 110 72 L110 90 Q90 95 60 95 Q30 95 10 90 Z"
        fill="#16a34a"
        opacity="0.3"
      />
      <path
        d="M10 80 Q30 72 50 76 Q70 80 90 74 Q105 70 110 75 L110 92 Q90 96 60 96 Q30 96 10 92 Z"
        fill="#22c55e"
        opacity="0.15"
      />

      {/* Flag pole */}
      <line x1="58" y1="20" x2="58" y2="70" stroke="#f2c75c" strokeWidth="2" strokeLinecap="round" />

      {/* Flag — waving */}
      <path d="M58 20 Q68 24 78 22 Q78 30 68 32 Q58 34 58 30 Z" fill="#f2c75c" />

      {/* Golf ball at base */}
      <circle cx="58" cy="73" r="5" fill="white" opacity="0.9" />
      <circle cx="56.5" cy="71.5" r="0.6" fill="#d4d4d8" />
      <circle cx="58.5" cy="71" r="0.6" fill="#d4d4d8" />
      <circle cx="60" cy="72" r="0.6" fill="#d4d4d8" />
      <circle cx="57" cy="73" r="0.6" fill="#d4d4d8" />
      <circle cx="59" cy="73.5" r="0.6" fill="#d4d4d8" />
      <circle cx="56" cy="74.5" r="0.6" fill="#d4d4d8" />
      <circle cx="58" cy="75" r="0.6" fill="#d4d4d8" />
      <circle cx="60" cy="74.5" r="0.6" fill="#d4d4d8" />

      {/* Analytics bar chart (EschMetrics signature) */}
      <rect x="75" y="42" width="5" height="18" rx="1" fill="#22c55e" opacity="0.6" />
      <rect x="82" y="36" width="5" height="24" rx="1" fill="#22c55e" opacity="0.7" />
      <rect x="89" y="30" width="5" height="30" rx="1" fill="#22c55e" opacity="0.8" />
      <rect x="96" y="38" width="5" height="22" rx="1" fill="#22c55e" opacity="0.5" />

      {/* Trend line over bars */}
      <path d="M77 44 L84 38 L91 32 L98 40" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="91" cy="32" r="2" fill="#22c55e" />

      {/* Bottom text area */}
      <text
        x="60"
        y="96"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        letterSpacing="1"
      >
        MASTER&apos;S
      </text>
      <text
        x="60"
        y="107"
        textAnchor="middle"
        fill="#22c55e"
        fontSize="9"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        letterSpacing="1"
      >
        POOL
      </text>
    </svg>
  );
}
