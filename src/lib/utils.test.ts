/**
 * Tests for src/lib/utils.ts
 * Covers: cn() utility (clsx + tailwind-merge)
 */

import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges conflicting tailwind classes', () => {
    // tailwind-merge should resolve p-4 vs p-2 to p-2 (last wins)
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('merges conflicting tailwind text colors', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object inputs', () => {
    expect(cn({ 'text-red-500': true, hidden: false })).toBe('text-red-500');
  });
});
