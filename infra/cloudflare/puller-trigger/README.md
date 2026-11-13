# Puller trigger (Cloudflare Worker)

Starts SBTime's data pullers on time. GitHub's own schedule for
[`.github/workflows/pullers.yml`](../../../.github/workflows/pullers.yml)
dropped most runs (1 of about 28 in its first evening), so this Worker's cron
triggers start the workflow through GitHub's "Run workflow" API instead.

| Cron (UTC)     | Pullers                                             |
| -------------- | --------------------------------------------------- |
| `*/15 * * * *` | `enrollment-active` (seat counts, seat alerts)      |
| `5 3,15 * * *` | `catalog-active`, then `terms-nearby`               |
| `20 10 * * *`  | `finals-active`, then `enrollment-current-ucsbplat` |

It runs on Cloudflare's free plan and has no web address.

## Set up

1. **GitHub token.** github.com → Settings → Developer settings → Personal
   access tokens → **Fine-grained tokens** → Generate new token:
   - Repository access: **Only select repositories** → `sbtime`
   - Permissions → Repository → **Actions: Read and write** (nothing else)
   - Expiration: the longest offered. Note the date: when it expires the
     pullers stop.
2. **Sign in to Cloudflare** (opens the browser):

   ```bash
   cd infra/cloudflare/puller-trigger && npm install && npx wrangler login
   ```

3. **Store the token** in the Worker (paste it when asked; it isn't saved in
   the repo):

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```

   The first time, Wrangler may ask to create the Worker; say yes.

4. **Deploy:**

   ```bash
   npx wrangler deploy
   ```

## Check it

- Cloudflare dashboard → Workers & Pages → `sbtime-puller-trigger` →
  **Settings → Trigger events** lists the three crons, and **Logs** shows
  `Started enrollment-active` every 15 minutes.
- GitHub → Actions → Data pullers shows a new run every 15 minutes.

A failed start (for example an expired token) shows in the Worker's logs as
`GitHub refused to start ...: 401`.

## Change the schedule

Edit both `crons` in `wrangler.toml` and `PULLERS_BY_CRON` in `src/index.ts`,
then run `npx wrangler deploy` again.

## Try it locally

Put a token in `.dev.vars` (ignored by git) as `GITHUB_TOKEN=...`, then:

```bash
npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

With a real token this starts a real puller run.
