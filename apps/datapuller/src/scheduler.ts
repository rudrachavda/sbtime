import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Runs the UCSB pullers on a schedule, one at a time, for local development
 * and simple hosting. Production can instead run each puller as its own
 * scheduled job with the same intervals (Berkeleytime uses Kubernetes
 * CronJobs, see infra/app/values.yaml).
 *
 *   npx tsx src/scheduler.ts
 */

interface Job {
  puller: string;
  everyMinutes: number;
}

export const JOBS: Job[] = [
  // Seat counts, like Berkeleytime's 15-minute enrollment job.
  { puller: "enrollment-active", everyMinutes: 15 },
  // Classes, times, rooms and instructors: twice a day.
  { puller: "catalog-active", everyMinutes: 12 * 60 },
  // Quarter dates and which quarter is current: twice a day.
  { puller: "terms-nearby", everyMinutes: 12 * 60 },
  // Final exam times: once a day (one request per lecture).
  { puller: "finals-active", everyMinutes: 24 * 60 },
];

const MAIN = fileURLToPath(new URL("./main.ts", import.meta.url));

const runPuller = (puller: string) => {
  const started = Date.now();
  console.log(`[scheduler] ${new Date().toISOString()} starting ${puller}`);

  // A separate process per run, since each puller exits when done.
  const result = spawnSync("npx", ["tsx", MAIN, `--puller=${puller}`], {
    stdio: "inherit",
    env: process.env,
  });

  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `[scheduler] ${puller} ${result.status === 0 ? "finished" : `failed (exit ${result.status})`} in ${seconds}s`
  );
};

const main = async () => {
  const nextRun = new Map(JOBS.map((job) => [job.puller, 0]));
  console.log(
    `[scheduler] running ${JOBS.map((job) => `${job.puller} every ${job.everyMinutes} min`).join(", ")}`
  );

  for (;;) {
    for (const job of JOBS) {
      if (Date.now() >= (nextRun.get(job.puller) ?? 0)) {
        // Schedule from the start of the run so the interval stays steady.
        nextRun.set(job.puller, Date.now() + job.everyMinutes * 60 * 1000);
        runPuller(job.puller);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
  }
};

main();
