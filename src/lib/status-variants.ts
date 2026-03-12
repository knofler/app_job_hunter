/**
 * Shared status-to-Badge-variant mappings for the Recruiter Workspace.
 * Centralises color decisions so every page renders consistent badges.
 */
import type { BadgeProps } from '@/components/ui/Badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

/** Map a numeric score (0-100) to a Badge variant. */
export function scoreVariant(score: number): BadgeVariant {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'error';
}

/** Map a hiring verdict string to a Badge variant. */
export function verdictVariant(verdict: string): BadgeVariant {
  const v = verdict.toLowerCase();
  if (v === 'hire' || v === 'strong hire') return 'success';
  if (v === 'maybe' || v === 'lean hire') return 'warning';
  return 'error';
}

/** Map a skill-status string to a Badge variant. */
export function skillStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === 'yes' || s === 'present') return 'success';
  if (s === 'partial') return 'warning';
  return 'error';
}

/** Map a priority string (Hot / Warm / Pipeline) to a Badge variant. */
export function priorityVariant(priority: string): BadgeVariant {
  const p = priority.toLowerCase();
  if (p === 'hot') return 'error';
  if (p === 'warm') return 'warning';
  return 'info';
}
