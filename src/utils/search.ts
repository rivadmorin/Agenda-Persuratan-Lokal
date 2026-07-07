/**
 * Robust and lightweight client-side Fuzzy Search matching algorithm.
 * Inspired by meilisearch/fuse.js but tailored for high performance and zero external dependencies.
 */

export interface FuzzyResult {
  matches: boolean;
  score: number;
}

/**
 * Scoring constants for the fuzzy search algorithm.
 */
const SCORE_EXACT_MATCH = 1000;
const SCORE_SUBSTRING_BASE = 500;
const SCORE_SUBSEQUENCE_CHAR = 10;
const SCORE_CONSECUTIVE_MULTIPLIER = 12;
const PENALTY_POSITION_MULTIPLIER = 0.4;

const WEIGHT_TYPE_MATCH = 1.5;
const WEIGHT_CRITICAL_FIELD = 1.3;
const WEIGHT_DEFAULT_FIELD = 1.0;

/**
 * Checks if query matches text via a subsequence search with scoring.
 * Matches are graded on:
 * 1. Exact string matches (highest score)
 * 2. Exact substring match (high score)
 * 3. Subsequence matches (e.g. "agnd" -> "agenda") with bonus for consecutive matching characters.
 *
 * @param text - The full text to search within.
 * @param query - The string to search for.
 * @returns A FuzzyResult containing whether it matched and the calculated score.
 */
export function fuzzyMatch(text: string, query: string): FuzzyResult {
  if (!query) return { matches: true, score: 0 };
  if (query.length > text.length) return { matches: false, score: 0 };
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // 1. Exact match
  if (t === q) {
    return { matches: true, score: SCORE_EXACT_MATCH };
  }

  // 2. Exact substring match
  const idx = t.indexOf(q);
  if (idx !== -1) {
    // High score, higher if it starts with the query, slightly penalized for position
    return { matches: true, score: SCORE_SUBSTRING_BASE - idx };
  }

  // 3. Subsequence match
  let qIdx = 0;
  let tIdx = 0;
  let score = 0;
  let consecutiveCount = 0;

  while (qIdx < q.length && tIdx < t.length) {
    if (q[qIdx] === t[tIdx]) {
      consecutiveCount++;
      // Give bonus for matching characters and consecutive strings, penalize distance from start
      score += SCORE_SUBSEQUENCE_CHAR + (consecutiveCount * SCORE_CONSECUTIVE_MULTIPLIER) - (tIdx * PENALTY_POSITION_MULTIPLIER);
      qIdx++;
    } else {
      consecutiveCount = 0;
    }
    tIdx++;
  }

  const matches = qIdx === q.length;
  return { matches, score: matches ? Math.max(1, score) : 0 };
}

/**
 * Searches across a MailRecord's properties and calculates an aggregate score.
 * Applies different weight multipliers based on the field type.
 *
 * @param mail - The mail record containing type and metadata fields.
 * @param query - The string to search for.
 * @returns The highest match score found among all searched fields.
 */
export function getMailSearchScore(mail: { type: string; metadata: Record<string, any> }, query: string): FuzzyResult {
  if (!query) return { matches: true, score: 0 };

  const scores: number[] = [];

  // Check type
  const typeRes = fuzzyMatch(mail.type, query);
  if (typeRes.matches) {
    scores.push(typeRes.score * WEIGHT_TYPE_MATCH); // Weight type matches slightly higher
  }

  // Check metadata fields
  if (mail.metadata) {
    for (const [key, value] of Object.entries(mail.metadata)) {
      if (!value) continue;
      const valStr = String(value);
      const res = fuzzyMatch(valStr, query);
      if (res.matches) {
        // Boost critical fields like nomorSurat or perihal
        const isCriticalField = ['nomorSurat', 'noSurat', 'perihal', 'pengirim', 'suratDari', 'penerima', 'tujuan', 'noUrut', 'penomoran'].includes(key);
        scores.push(res.score * (isCriticalField ? WEIGHT_CRITICAL_FIELD : WEIGHT_DEFAULT_FIELD));
      }
    }
  }

  if (scores.length === 0) {
    return { matches: false, score: 0 };
  }

  // Return the highest match score found
  return { matches: true, score: Math.max(...scores) };
}
