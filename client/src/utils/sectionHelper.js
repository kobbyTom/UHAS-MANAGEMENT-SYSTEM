export const mapSectionName = (name) => {
  if (!name) return name;
  const upper = String(name).toUpperCase().trim();
  if (upper === 'A' || upper === 'Y' || upper === 'YELLOW') return 'Yellow (Y)';
  if (upper === 'B' || upper === 'G' || upper === 'GREEN') return 'Green (G)';
  if (upper === 'C' || upper === 'R' || upper === 'RED') return 'Red (R)';
  if (upper === 'D' || upper === 'B' || upper === 'BLUE') return 'Blue (B)';
  return name;
};
