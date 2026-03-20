/**
 * Tests for src/lib/fallback-data.ts
 * Validates structure and integrity of fallback data
 */

import {
  fallbackResumes,
  fallbackResumeHealth,
  fallbackTopMatches,
  fallbackPipelineCounts,
  fallbackSuggestedActions,
  fallbackJobs,
  fallbackApplications,
} from './fallback-data';

describe('fallbackResumes', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(fallbackResumes)).toBe(true);
    expect(fallbackResumes.length).toBeGreaterThan(0);
  });

  it('each resume has required fields', () => {
    for (const resume of fallbackResumes) {
      expect(resume.id).toBeTruthy();
      expect(resume.slug).toBeTruthy();
      expect(resume.name).toBeTruthy();
      expect(['Technical', 'Business', 'Creative']).toContain(resume.type);
      expect(resume.summary).toBeTruthy();
      expect(resume.preview).toBeTruthy();
      expect(Array.isArray(resume.skills)).toBe(true);
      expect(resume.skills.length).toBeGreaterThan(0);
      expect(resume.lastUpdated).toBeTruthy();
    }
  });

  it('has unique IDs', () => {
    const ids = fallbackResumes.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('fallbackResumeHealth', () => {
  it('has a score between 0 and 100', () => {
    expect(fallbackResumeHealth.score).toBeGreaterThanOrEqual(0);
    expect(fallbackResumeHealth.score).toBeLessThanOrEqual(100);
  });

  it('has sub_scores array', () => {
    expect(Array.isArray(fallbackResumeHealth.sub_scores)).toBe(true);
    expect(fallbackResumeHealth.sub_scores.length).toBeGreaterThan(0);
  });

  it('each sub_score has label and value', () => {
    for (const sub of fallbackResumeHealth.sub_scores) {
      expect(sub.label).toBeTruthy();
      expect(typeof sub.value).toBe('number');
    }
  });
});

describe('fallbackTopMatches', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(fallbackTopMatches)).toBe(true);
    expect(fallbackTopMatches.length).toBeGreaterThan(0);
  });

  it('each match has required fields', () => {
    for (const match of fallbackTopMatches) {
      expect(match.title).toBeTruthy();
      expect(match.company).toBeTruthy();
      expect(typeof match.match_score).toBe('number');
    }
  });
});

describe('fallbackPipelineCounts', () => {
  it('is a non-empty object', () => {
    expect(typeof fallbackPipelineCounts).toBe('object');
    expect(Object.keys(fallbackPipelineCounts).length).toBeGreaterThan(0);
  });

  it('all values are numbers', () => {
    for (const [key, value] of Object.entries(fallbackPipelineCounts)) {
      expect(key).toBeTruthy();
      expect(typeof value).toBe('number');
    }
  });
});

describe('fallbackJobs', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(fallbackJobs)).toBe(true);
    expect(fallbackJobs.length).toBeGreaterThan(0);
  });

  it('each job has required fields', () => {
    for (const job of fallbackJobs) {
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.company).toBeTruthy();
    }
  });
});

describe('fallbackApplications', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(fallbackApplications)).toBe(true);
    expect(fallbackApplications.length).toBeGreaterThan(0);
  });
});

describe('fallbackSuggestedActions', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(fallbackSuggestedActions)).toBe(true);
    expect(fallbackSuggestedActions.length).toBeGreaterThan(0);
  });

  it('each action has required fields', () => {
    for (const action of fallbackSuggestedActions) {
      expect(action.id).toBeTruthy();
      expect(action.text).toBeTruthy();
    }
  });
});
