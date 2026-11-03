export type WordColumns = [string, string][];
export type ColumnOrder = 'foreign-first' | 'swedish-first';

export const parseWordList = (text: string, foreignLanguage: 'German' | 'French' = 'German'): WordColumns => {
  const rows: WordColumns = [];
  const invalidLines: number[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const explicitParts = line.trim().split(/\t+|;|=|\s+[-–—]\s+/).map((part) => part.trim());
    const parts = explicitParts.length > 1
      ? explicitParts
      : line.trim().match(foreignLanguage === 'German'
        ? /\b(?:der|die|das)\s+\S+|\S+/gi
        : /\b(?:le|la|les|un|une|des)\s+\S+|l'\S+|\S+/gi) ?? [];
    if (parts.length !== 2 || parts.some((part) => !part)) {
      invalidLines.push(index + 1);
    } else {
      rows.push([parts[0], parts[1]]);
    }
  });
  if (invalidLines.length) {
    throw new Error(`Kontrollera rad ${invalidLines.join(', ')}. Använd tabb, semikolon, likhetstecken eller ett streck med mellanrum om delningen med mellanslag är oklar.`);
  }
  if (!rows.length) throw new Error('Klistra in minst ett ordpar.');
  return rows;
};

export const detectColumnOrder = (rows: WordColumns, unknownWords: string[]): ColumnOrder | null => {
  const unknown = new Set(unknownWords);
  let firstVotes = 0;
  let secondVotes = 0;
  for (const [first, second] of rows) {
    const firstKnown = !unknown.has(first);
    const secondKnown = !unknown.has(second);
    if (firstKnown && !secondKnown) firstVotes++;
    if (secondKnown && !firstKnown) secondVotes++;
  }
  const decisiveVotes = firstVotes + secondVotes;
  const winningVotes = Math.max(firstVotes, secondVotes);
  if (!decisiveVotes || winningVotes / decisiveVotes < 0.8 || winningVotes / rows.length < 0.5) return null;
  return firstVotes > secondVotes ? 'foreign-first' : 'swedish-first';
};
