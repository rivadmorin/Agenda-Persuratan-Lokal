import { describe, it, expect } from 'vitest';
import { fuzzyMatch, getMailSearchScore } from './search';

describe('fuzzyMatch', () => {
  it('returns score 0 and matches true for empty query', () => {
    const result = fuzzyMatch('anything', '');
    expect(result).toEqual({ matches: true, score: 0 });
  });

  it('handles exact matches case-insensitively with high score', () => {
    const result1 = fuzzyMatch('Agenda', 'agenda');
    const result2 = fuzzyMatch('test', 'TEST');
    expect(result1).toEqual({ matches: true, score: 1000 });
    expect(result2).toEqual({ matches: true, score: 1000 });
  });

  it('handles substring matches with score based on position', () => {
    // "gen" in "agenda" -> starts at index 1
    const result = fuzzyMatch('agenda', 'gen');
    expect(result).toEqual({ matches: true, score: 500 - 1 });

    // "age" in "agenda" -> starts at index 0
    const resultStart = fuzzyMatch('agenda', 'age');
    expect(resultStart).toEqual({ matches: true, score: 500 - 0 });
  });

  it('handles subsequence matches with correct scoring', () => {
    // "agnd" in "agenda"
    // 'a' at 0: 10 + 1*12 - 0*0.4 = 22
    // 'g' at 1: 10 + 2*12 - 1*0.4 = 33.6
    // 'n' at 3: 10 + 1*12 - 3*0.4 = 20.8
    // 'd' at 4: 10 + 2*12 - 4*0.4 = 32.4
    // Total: 22 + 33.6 + 20.8 + 32.4 = 108.8
    const result = fuzzyMatch('agenda', 'agnd');
    expect(result.matches).toBe(true);
    expect(result.score).toBeCloseTo(108.8, 1);
  });

  it('returns matches false and score 0 for non-matches', () => {
    const result = fuzzyMatch('agenda', 'xyz');
    expect(result).toEqual({ matches: false, score: 0 });
  });

  it('returns matches false if query is longer than text', () => {
    const result = fuzzyMatch('abc', 'abcd');
    expect(result).toEqual({ matches: false, score: 0 });
  });
});

describe('getMailSearchScore', () => {
  const mockMail = {
    type: 'Surat Masuk',
    metadata: {
      nomorSurat: '123/ABC/2023',
      perihal: 'Undangan Rapat',
      keterangan: 'Penting sekali'
    }
  };

  it('returns matches true and score 0 for empty query', () => {
    const result = getMailSearchScore(mockMail, '');
    expect(result).toEqual({ matches: true, score: 0 });
  });

  it('applies 1.5x weight to type matches', () => {
    const query = 'Surat Masuk';
    const baseScore = 1000; // exact match
    const result = getMailSearchScore(mockMail, query);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(baseScore * 1.5);
  });

  it('applies 1.3x weight to critical metadata fields', () => {
    // nomorSurat is critical
    const query = '123/ABC/2023';
    const baseScore = 1000;
    const result = getMailSearchScore(mockMail, query);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(baseScore * 1.3);
  });

  it('applies 1.0x weight to non-critical metadata fields', () => {
    // keterangan is not in critical fields list
    const query = 'Penting sekali';
    const baseScore = 1000;
    const result = getMailSearchScore(mockMail, query);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(baseScore * 1.0);
  });

  it('returns the maximum weighted score when multiple fields match', () => {
    const mail = {
      type: 'Agenda', // fuzzyMatch('Agenda', 'age') = 500
      metadata: {
        perihal: 'Agency' // fuzzyMatch('Agency', 'age') = 500 (critical, 1.3x)
      }
    };
    // Score from type: 500 * 1.5 = 750
    // Score from perihal: 500 * 1.3 = 650
    const result = getMailSearchScore(mail, 'age');
    expect(result.score).toBe(750);
  });

  it('returns matches false when no fields match', () => {
    const result = getMailSearchScore(mockMail, 'unmatchable-query');
    expect(result).toEqual({ matches: false, score: 0 });
  });
});
