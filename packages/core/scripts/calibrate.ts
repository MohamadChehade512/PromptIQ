/**
 * Prints the calibration table: `pnpm calibrate`.
 * Holdout prompts are summarized only; pass `--holdout` to list them (after tuning is done).
 */
import { HOLDOUT_SET, runCalibration } from '../src/scoring/calibration/calibrate';

const showHoldout = process.argv.includes('--holdout');
const byUseCase = process.argv.includes('--by-use-case');

function print(title: string, report: ReturnType<typeof runCalibration>, rows: boolean) {
  console.log(`\n== ${title} (${report.rows.length} prompts)`);
  if (rows) {
    for (const r of report.rows) {
      const mark = r.inRange ? ' ' : '✗';
      console.log(
        `${mark} ${String(r.score).padStart(3)}  ${r.label.padEnd(6)} ${r.platform.padEnd(6)} ${r.id.padEnd(12)} ${r.topFindings.join(', ')}`,
      );
    }
  }
  console.log(
    `accuracy ${(report.accuracy * 100).toFixed(0)}%  spearman ${report.spearman.toFixed(3)}  ` +
      `means weak ${report.means.weak.toFixed(0)} / ok ${report.means.ok.toFixed(0)} / strong ${report.means.strong.toFixed(0)}`,
  );
  if (byUseCase) {
    const uses = [...new Set(report.rows.map((r) => r.useCase))];
    for (const u of uses) {
      const rs = report.rows.filter((r) => r.useCase === u);
      const ok = rs.filter((r) => r.inRange).length;
      console.log(`  ${u.padEnd(14)} ${ok}/${rs.length} in band`);
    }
  }
}

print('Tuning set', runCalibration(), true);
print('Holdout set', runCalibration(HOLDOUT_SET), showHoldout);
