// Strip diacritics/accents, hyphens, and lowercase for fuzzy name matching
// e.g., "José María Olazábal" → "jose maria olazabal"
// e.g., "Rasmus Højgaard" → "rasmus hojgaard"
// e.g., "Hao-Tong Li" → "haotong li"
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .replace(/ø/g, "o")             // ø doesn't decompose via NFD
    .replace(/Ø/g, "O")
    .replace(/ð/g, "d")             // Icelandic eth
    .replace(/Ð/g, "D")
    .replace(/-/g, "")              // strip hyphens
    .toLowerCase()
    .trim();
}

// Bidirectional alias map for names that differ beyond accents/diacritics
const NAME_ALIASES: Record<string, string[]> = {
  "nico echavarria": ["nicolas echavarria"],
  "nicolas echavarria": ["nico echavarria"],
  "alex noren": ["alexander noren"],
  "alexander noren": ["alex noren"],
  "johnny keefer": ["john keefer"],
  "john keefer": ["johnny keefer"],
  "matt mccarty": ["matthew mccarty"],
  "matthew mccarty": ["matt mccarty"],
};

// Check if two golfer names match (handles accents, hyphens, aliases, partial matches)
export function namesMatch(espnName: string, dbName: string): boolean {
  const a = normalizeName(espnName);
  const b = normalizeName(dbName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // Check aliases
  const aliasesA = NAME_ALIASES[a] || [];
  const aliasesB = NAME_ALIASES[b] || [];
  for (const alias of aliasesA) {
    if (alias === b || alias.includes(b) || b.includes(alias)) return true;
  }
  for (const alias of aliasesB) {
    if (alias === a || alias.includes(a) || a.includes(alias)) return true;
  }
  return false;
}
