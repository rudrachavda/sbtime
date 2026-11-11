/**
 * Repairs course descriptions from UCSB's developer API.
 *
 * The API returns descriptions that were stored as 75-character lines and
 * joined with a space, so a space appears after every 75 characters:
 * "the earlie st times", "d igital circuits". Sometimes that position is a
 * genuine word break ("division of"), so each one is checked against the
 * vocabulary of all descriptions: the space is removed only when the two
 * fragments make a known word and are not known words themselves.
 */

/** Width of the lines the registrar's system stores. */
const LINE_WIDTH = 75;

export type Vocabulary = Map<string, number>;

/**
 * A line that ended in spaces was trimmed before joining, which pulls every
 * later boundary a character or two earlier.
 */
const MAX_DRIFT = 2;

/**
 * Indexes of the spaces that sit on a line boundary. Each is either a space
 * inserted mid-word or a genuine word break; `repairDescription` decides.
 */
export const boundarySpaces = (text: string): number[] => {
  const positions: number[] = [];
  let expected = LINE_WIDTH;

  while (expected < text.length) {
    let found = -1;
    for (let drift = 0; drift <= MAX_DRIFT; drift++) {
      if (text[expected - drift] === " ") {
        found = expected - drift;
        break;
      }
    }

    // No space near the boundary: the text is not line-wrapped from here on.
    if (found === -1) break;

    positions.push(found);
    expected = found + LINE_WIDTH + 1;
  }

  return positions;
};

const normalizeWord = (word: string) =>
  word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");

/**
 * Count the words used across a set of texts. Words touching a line boundary
 * are skipped, since they may be fragments.
 */
export const buildVocabulary = (
  texts: Iterable<string | null | undefined>
): Vocabulary => {
  const vocabulary: Vocabulary = new Map();

  for (const text of texts) {
    if (!text) continue;

    const boundaries = new Set(boundarySpaces(text));

    for (const match of text.matchAll(/\S+/g)) {
      const start = match.index;
      const end = start + match[0].length;
      if (boundaries.has(end) || boundaries.has(start - 1)) continue;

      const word = normalizeWord(match[0]);
      if (word) vocabulary.set(word, (vocabulary.get(word) ?? 0) + 1);
    }
  }

  return vocabulary;
};

// How much more common the joined word must be than its rarer half before two
// real words ("in" + "to") are merged.
const JOIN_RATIO = 5;

/** A lone letter other than "a" or "I" is never a word on its own. */
const countOf = (vocabulary: Vocabulary, word: string) =>
  word.length === 1 && word !== "a" && word !== "i"
    ? 0
    : (vocabulary.get(word) ?? 0);

const shouldJoin = (left: string, right: string, vocabulary: Vocabulary) => {
  // Only letters on both sides of the gap can belong to one word.
  if (!/[a-z]$/i.test(left) || !/^[a-z]/i.test(right)) return false;

  const a = normalizeWord(left);
  const b = normalizeWord(right);
  const leftCount = countOf(vocabulary, a);
  const rightCount = countOf(vocabulary, b);
  const joinedCount = countOf(vocabulary, normalizeWord(left + right));

  if (joinedCount > 0) {
    if (leftCount === 0 || rightCount === 0) return true;
    return joinedCount >= JOIN_RATIO * Math.min(leftCount, rightCount);
  }

  // Nothing is recognised. A very short fragment is far more likely to be a
  // split rare word ("sexualit y") than two unknown words in a row.
  return (
    leftCount === 0 && rightCount === 0 && Math.min(a.length, b.length) <= 3
  );
};

/**
 * Remove the spaces that were inserted in the middle of words, and collapse
 * any runs of whitespace.
 */
export const repairDescription = (
  text: string | null | undefined,
  vocabulary: Vocabulary
): string => {
  if (!text) return "";

  const characters = [...text];

  for (const position of boundarySpaces(text)) {
    const left = /(\S+)$/.exec(text.slice(0, position))?.[1];
    const right = /^(\S+)/.exec(text.slice(position + 1))?.[1];

    if (left && right && shouldJoin(left, right, vocabulary)) {
      characters[position] = "";
    }
  }

  return characters.join("").replace(/\s+/g, " ").trim();
};
