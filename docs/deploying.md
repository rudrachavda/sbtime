# Deploying SBTime

SBTime runs on Vercel (free Hobby plan) as two services defined in
[`vercel.json`](../vercel.json):

- **frontend** (`apps/frontend`, Vite): every path except `/api`.
- **backend** (`apps/backend`, Express as a serverless function): `/api/...`.
  Vercel runs `apps/backend/src/index.ts`; local Docker runs `main.ts`.

The database is MongoDB Atlas (Flex, AWS Oregon), the cache is Upstash Redis
(AWS Oregon), and the data pullers run on a schedule in GitHub Actions
([`.github/workflows/pullers.yml`](../.github/workflows/pullers.yml)).

## Vercel project settings

- **Framework preset:** Services (Vercel reads `vercel.json`).
- **Functions region:** Portland, `pdx1` (next to Atlas and Upstash).

## Vercel environment variables (Production)

Real values:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | the Atlas connection string (database `sbtime`) |
| `REDIS_URI` | the Upstash `rediss://...` address |
| `SESSION_SECRET` | a new long random string (not the local one) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the Google OAuth client |
| `BACKEND_PUBLIC_URL` | `https://ucsbtime.com/api` |
| `SITE_URL` | `https://ucsbtime.com` |
| `URL` | `https://ucsbtime.com` |
| `BACKEND_PATH` | `/api` |
| `GRAPHQL_PATH` | `/graphql` |
| `PORT` | `5001` (required by the config; Vercel ignores it) |
| `CACHE_WARMING_PORT` | `8080` (required by the config; unused) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `sbtime.alerts@gmail.com` |
| `SMTP_PASSWORD` | the Gmail app password |
| `SMTP_FROM` | `SBTime <sbtime.alerts@gmail.com>` |

Required by the shared config but unused by SBTime (Berkeley's SIS and S3
sources and the semantic-search service). Set each to `unused`:

`SIS_CLASS_APP_ID`, `SIS_CLASS_APP_KEY`, `SIS_COURSE_APP_ID`,
`SIS_COURSE_APP_KEY`, `SIS_TERM_APP_ID`, `SIS_TERM_APP_KEY`,
`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`,
`S3_IMAGES_ACCESS_URL`, `SEMANTIC_SEARCH_URL`

The frontend needs no variables (the map is switched off).

## GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions → New repository
secret:

| Name | Value |
|---|---|
| `MONGODB_URI` | the Atlas connection string |
| `UCSB_API_KEY` | the UCSB developer API key |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | as above (seat-alert emails) |

Run any puller by hand from the Actions tab → Data pullers → Run workflow.
GitHub pauses scheduled workflows in public repositories after 60 days with
no commits; re-enable them on the Actions tab if that happens.

## Other services

- **Atlas → Network Access:** allow `0.0.0.0/0` (Vercel and GitHub Actions
  have no fixed IP addresses); the database user's long password protects it.
- **Google Cloud → OAuth client:** add the origin `https://ucsbtime.com` and
  the redirect URI `https://ucsbtime.com/api/login/redirect`, then publish
  the app (Audience → Publish app).
- **Cloudflare → DNS:** add the A record (`@`) and CNAME (`www`) that Vercel
  shows under Settings → Domains, with the proxy off ("DNS only").
- **Local scheduler:** once the GitHub Actions schedule is running, stop the
  local `datapuller-scheduler` container or empty its `SMTP_HOST`, so a
  watched class doesn't email twice (once from each database).

## Check after the first deploy

- Deep links such as `/catalog/2027/Winter/ASAM/123A/0100/1` load the page.
  If they show Vercel's 404, the frontend service needs a fallback that
  serves `index.html` for every path.
- `https://ucsbtime.com/api/healthz` returns `OK`, and signing in with
  Google works.
- The Data pullers workflow's first runs succeed (Actions tab).
