/**
 * Tests for src/lib/status-variants.ts
 * Covers: scoreVariant, verdictVariant, skillStatusVariant, priorityVariant
 */

import {
  scoreVariant,
  verdictVariant,
  skillStatusVariant,
  priorityVariant,
} from './status-variants';

describe('scoreVariant', () => {
  it('returns success for scores >= 80', () => {
    expect(scoreVariant(80)).toBe('success');
    expect(scoreVariant(95)).toBe('success');
    expect(scoreVariant(100)).toBe('success');
  });

  it('returns info for scores >= 60 and < 80', () => {
    expect(scoreVariant(60)).toBe('info');
    expect(scoreVariant(79)).toBe('info');
  });

  it('returns warning for scores >= 40 and < 60', () => {
    expect(scoreVariant(40)).toBe('warning');
    expect(scoreVariant(59)).toBe('warning');
  });

  it('returns error for scores < 40', () => {
    expect(scoreVariant(0)).toBe('error');
    expect(scoreVariant(39)).toBe('error');
  });
});

describe('verdictVariant', () => {
  it('returns success for hire verdicts', () => {
    expect(verdictVariant('hire')).toBe('success');
    expect(verdictVariant('Hire')).toBe('success');
    expect(verdictVariant('strong hire')).toBe('success');
    expect(verdictVariant('Strong Hire')).toBe('success');
  });

  it('returns warning for maybe/lean hire verdicts', () => {
    expect(verdictVariant('maybe')).toBe('warning');
    expect(verdictVariant('Maybe')).toBe('warning');
    expect(verdictVariant('lean hire')).toBe('warning');
    expect(verdictVariant('Lean Hire')).toBe('warning');
  });

  it('returns error for other verdicts', () => {
    expect(verdictVariant('no hire')).toBe('error');
    expect(verdictVariant('reject')).toBe('error');
    expect(verdictVariant('unknown')).toBe('error');
  });
});

describe('skillStatusVariant', () => {
  it('returns success for yes/present', () => {
    expect(skillStatusVariant('yes')).toBe('success');
    expect(skillStatusVariant('Yes')).toBe('success');
    expect(skillStatusVariant('present')).toBe('success');
    expect(skillStatusVariant('Present')).toBe('success');
  });

  it('returns warning for partial', () => {
    expect(skillStatusVariant('partial')).toBe('warning');
    expect(skillStatusVariant('Partial')).toBe('warning');
  });

  it('returns error for other statuses', () => {
    expect(skillStatusVariant('no')).toBe('error');
    expect(skillStatusVariant('missing')).toBe('error');
    expect(skillStatusVariant('absent')).toBe('error');
  });
});

describe('priorityVariant', () => {
  it('returns error for hot', () => {
    expect(priorityVariant('hot')).toBe('error');
    expect(priorityVariant('Hot')).toBe('error');
  });

  it('returns warning for warm', () => {
    expect(priorityVariant('warm')).toBe('warning');
    expect(priorityVariant('Warm')).toBe('warning');
  });

  it('returns info for other priorities', () => {
    expect(priorityVariant('pipeline')).toBe('info');
    expect(priorityVariant('cold')).toBe('info');
    expect(priorityVariant('anything')).toBe('info');
  });
});
