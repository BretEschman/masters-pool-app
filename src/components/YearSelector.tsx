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
      className="border rounded px-3 py-2 text-lg font-bold text-[var(--masters-green)] bg-white"
    >
      {years.map((y) => (
        <option key={y.year} value={y.year}>
          {y.year} Master&apos;s Pool
        </option>
      ))}
    </select>
  );
}
