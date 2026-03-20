/**
 * Tests for src/lib/constants.ts
 */

import {
  DEFAULT_CANDIDATE_ID,
  DEFAULT_RECRUITER_ID,
  DEFAULT_ADMIN_USER_ID,
  ACTIVE_CANDIDATE_ID,
} from './constants';

describe('constants', () => {
  it('exports DEFAULT_CANDIDATE_ID', () => {
    expect(DEFAULT_CANDIDATE_ID).toBe('candidate_1');
  });

  it('exports DEFAULT_RECRUITER_ID', () => {
    expect(DEFAULT_RECRUITER_ID).toBe('recruiter_1');
  });

  it('exports DEFAULT_ADMIN_USER_ID', () => {
    expect(DEFAULT_ADMIN_USER_ID).toBe('admin_1');
  });

  it('ACTIVE_CANDIDATE_ID matches DEFAULT_CANDIDATE_ID', () => {
    expect(ACTIVE_CANDIDATE_ID).toBe(DEFAULT_CANDIDATE_ID);
  });
});
