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

## Vercel environment variables (Production and Preview)

Don't set `NODE_ENV`: when it's `production` during the build, npm skips
development packages such as Vite and the build fails. Left unset, SBTime
runs in production mode.

Required (the backend won't start without them):

| Name                                       | Value                                           |
| ------------------------------------------ | ----------------------------------------------- |
| `MONGODB_URI`                              | the Atlas connection string (database `sbtime`) |
| `REDIS_URI`                                | the Upstash `rediss://...` address              |
| `SESSION_SECRET`                           | a new long random string (not the local one)    |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the Google OAuth client                         |
| `URL`                                      | `https://ucsbtime.com`                          |

Also set:

| Name                 | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| `BACKEND_PUBLIC_URL` | `https://ucsbtime.com/api` (Google sign-in's return address)                 |
| `SITE_URL`           | `https://ucsbtime.com` (links in emails)                                     |
| `SMTP_HOST`          | `smtp.gmail.com`                                                             |
| `SMTP_PORT`          | `587`                                                                        |
| `SMTP_USER`          | `sbtime.alerts@gmail.com`                                                    |
| `SMTP_PASSWORD`      | the Gmail app password                                                       |
| `SMTP_FROM`          | `SBTime <sbtime.alerts@gmail.com>` (optional; defaults to the address alone) |

Everything else (`PORT`, `BACKEND_PATH`, `GRAPHQL_PATH`, Berkeley's SIS and
S3 settings, the semantic-search address) has a default in
`packages/common/src/utils/config.ts`. The frontend needs no variables (the
map is switched off).

## How Vercel runs it (lessons from the first deploy)

- Vercel compiles the backend to CommonJS and its loader can't `require()`
  ES-module-only packages, unlike local Node. Check new backend
  dependencies with `NODE_OPTIONS=--no-experimental-require-module` (see
  the commit that replaced `uuid` with `crypto.randomUUID()`).
- Direct links such as `/catalog` work through the top-level rewrite of
  every extension-less path to `/index.html` in `vercel.json`. Rewrites with
  a service `path`, a service's own `routes`, and a `404.html` copy did not
  work for the static frontend.
- Runtime crashes show in Vercel's Logs at the **Info** level, not Error;
  open a row to read the message.

## GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions → New repository
secret:

| Name                                                                | Value                        |
| ------------------------------------------------------------------- | ---------------------------- |
| `MONGODB_URI`                                                       | the Atlas connection string  |
| `UCSB_API_KEY`                                                      | the UCSB developer API key   |
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
