"use client";

import { Year } from "@/lib/types";

interface Props {
  years: Year[];
  selectedYear: number;
  onChange: (year: number) => void;
}

export default function YearSelector({ years, selectedYear, onChange }: Props) {
  return (
    <select
      value={selectedYear}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-lg font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--em-green-dark)] cursor-pointer"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {years.map((y) => (
        <option key={y.year} value={y.year}>
          {y.year} Pool
        </option>
      ))}
    </select>
  );
}
