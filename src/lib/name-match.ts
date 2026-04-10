// Strip diacritics/accents, hyphens, and lowercase for fuzzy name matching
// e.g., "José María Olazábal" → "jose maria olazabal"
// e.g., "Rasmus Højgaard" → "rasmus hojgaard"
// e.g., "Hao-Tong Li" → "haotong li"
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .replace(/-/g, "")              // strip hyphens
    .toLowerCase()
    .trim();
}

// ESPN names that don't match DB names via normalization alone
const NAME_ALIASES: Record<string, string> = {
  "nico echavarria": "nicolas echavarria",
  "nicolas echavarria": "nico echavarria",
};

// Check if two golfer names match (handles accents, hyphens, aliases, partial matches)
export function namesMatch(espnName: string, dbName: string): boolean {
  const a = normalizeName(espnName);
  const b = normalizeName(dbName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // Check aliases
  const aliasA = NAME_ALIASES[a];
  const aliasB = NAME_ALIASES[b];
  if (aliasA && (aliasA === b || aliasA.includes(b) || b.includes(aliasA))) return true;
  if (aliasB && (aliasB === a || aliasB.includes(a) || a.includes(aliasB))) return true;
  return false;
}
