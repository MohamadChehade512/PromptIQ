import { describe, expect, it } from 'vitest';
import { HOLDOUT_SET, TUNING_SET, runCalibration } from './calibrate';

/**
 * Guards the scorer against regressions (PLAN.md §2.7). Run `pnpm --filter
 * @promptgenius/core calibrate` for the full table when tuning rules or weights.
 */
describe('calibration', () => {
  const report = runCalibration();

  it('covers coding, writing and Q&A with at least 25 prompts each', () => {
    for (const useCase of ['coding', 'writing', 'qa'] as const) {
      expect(TUNING_SET.filter((p) => p.useCase === useCase).length).toBeGreaterThanOrEqual(25);
    }
  });

  it('places at least 90% of labeled prompts in their band', () => {
    expect(report.accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('ranks prompts consistently with the labels', () => {
    expect(report.spearman).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps label means clearly separated', () => {
    expect(report.means.ok - report.means.weak).toBeGreaterThan(20);
    expect(report.means.strong - report.means.ok).toBeGreaterThan(20);
  });

  it('generalizes to the held-out prompts', () => {
    // Smaller set, so a looser bar; a drop here means a rule change overfit the tuning set.
    const holdout = runCalibration(HOLDOUT_SET);
    expect(holdout.accuracy).toBeGreaterThanOrEqual(0.8);
    expect(holdout.spearman).toBeGreaterThanOrEqual(0.85);
  });
});
