// Starts SBTime's data pullers on time.
//
// GitHub's own schedule for .github/workflows/pullers.yml is best-effort and
// dropped most runs, so this Worker's cron triggers start the workflow
// instead, through GitHub's "Run workflow" API (workflow_dispatch), which
// GitHub doesn't drop.
//
// Each cron below must also be listed under [triggers] in wrangler.toml.

interface Env {
  /** Fine-grained GitHub token: this repository only, Actions read/write. */
  GITHUB_TOKEN: string;
}

const REPOSITORY = "rudrachavda/sbtime";
const WORKFLOW_FILE = "pullers.yml";
const BRANCH = "main";

// The same jobs and timings as apps/datapuller/src/scheduler.ts (UTC).
const PULLERS_BY_CRON: Record<string, string[]> = {
  // Seat counts.
  "*/15 * * * *": ["enrollment-active"],
  // Catalog and quarter dates, twice a day.
  "5 3,15 * * *": ["catalog-active", "terms-nearby"],
  // Final exams and the UCSBPlat catch-up, daily.
  "20 10 * * *": ["finals-active", "enrollment-current-ucsbplat"],
};

async function startPullers(pullers: string[], env: Env): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "sbtime-puller-trigger",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // One run per cron, so jobs that belong together (the catalog then the
      // quarter dates) run in order inside it. `puller` is the field the
      // "Run workflow" form uses; `pullers` carries the whole list.
      body: JSON.stringify({
        ref: BRANCH,
        inputs: { puller: pullers[0], pullers: pullers.join(" ") },
      }),
    }
  );

  // GitHub answers 204 No Content when the run is queued.
  if (response.status !== 204) {
    const detail = (await response.text()).slice(0, 500);
    // Thrown errors show as failed invocations in the Worker's logs.
    throw new Error(
      `GitHub refused to start ${pullers.join(", ")}: ${response.status} ${detail}`
    );
  }

  console.log(`Started ${pullers.join(", ")}`);
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const pullers = PULLERS_BY_CRON[controller.cron];
    if (!pullers) {
      throw new Error(`No pullers set up for cron "${controller.cron}"`);
    }
    await startPullers(pullers, env);
  },
} satisfies ExportedHandler<Env>;
