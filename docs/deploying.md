# Deploying SBTime

SBTime runs on Vercel (free Hobby plan) as two services defined in
[`vercel.json`](../vercel.json):

- **frontend** (`apps/frontend`, Vite): every path except `/api`.
- **backend** (`apps/backend`, Express as a serverless function): `/api/...`.
  Vercel runs `apps/backend/src/index.ts`; local Docker runs `main.ts`.

The database is MongoDB Atlas (Flex, AWS Oregon), the cache is Upstash Redis
(AWS Oregon), and the data pullers run in GitHub Actions, started on schedule by a Cloudflare Worker
([`.github/workflows/pullers.yml`](../.github/workflows/pullers.yml)).

## Vercel project settings

- **Framework preset:** Services (Vercel reads `vercel.json`).
- **Functions region:** Portland, `pdx1` (next to Atlas and Upstash).

## Vercel environment variables (Production)

Set these for **Production** only, except `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`, which Production and Preview share. Keeping the
rest out of Preview means a preview or UAT build can never reach the live
database, cache or email account (see [UAT](#uat-uatucsbtimecom)).

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

## UAT (uat.ucsbtime.com)

UAT is a copy of the site for trying changes before they reach
ucsbtime.com. It deploys from the `uat` branch as a Vercel Preview, uses its
own database (`sbtime-uat` on the same Atlas cluster) and its own Upstash
cache, and sends no email. Vercel's deployment protection keeps it private:
only people signed in to the Vercel team can open it.

**Day to day:** push a change to `uat`, check it at uat.ucsbtime.com, then
merge it into `main` for production.

```bash
git push origin main:uat          # or: git checkout uat && git merge <branch> && git push
```

**Refresh UAT's data** from production when it gets stale (replaces UAT's
users, schedules and plans too):

```bash
scripts/refresh-uat-db.sh
```

The pullers in GitHub Actions only write to production, so UAT's class data
stays as of the last refresh.

### Setting it up

1. Push a `uat` branch to GitHub (`git push origin main:uat`).
2. **Upstash:** create a second Redis database (AWS Oregon, free) for UAT.
3. **Vercel → Settings → Environment Variables**, environment **Preview**,
   branch **uat**:

   | Name                 | Value                                                       |
   | -------------------- | ----------------------------------------------------------- |
   | `MONGODB_URI`        | the Atlas connection string with database `sbtime-uat`      |
   | `REDIS_URI`          | the UAT Upstash `rediss://...` address                      |
   | `SESSION_SECRET`     | a new random string (not production's)                      |
   | `URL`                | `https://uat.ucsbtime.com`                                  |
   | `SITE_URL`           | `https://uat.ucsbtime.com`                                  |
   | `BACKEND_PUBLIC_URL` | `https://uat.ucsbtime.com/api`                              |
   | `DEV_AUTH_ENABLED`   | `true` (the DEV "Select User" sign-in; never in Production) |

   Leave the `SMTP_*` settings unset; without `SMTP_HOST` the backend skips
   email.

4. **Vercel → Settings → Domains:** add `uat.ucsbtime.com` and set its Git
   branch to `uat`.
5. **Cloudflare → DNS:** add the CNAME `uat` that Vercel shows, DNS only.
6. **Google Cloud → OAuth client:** add the origin `https://uat.ucsbtime.com`
   and the redirect URI `https://uat.ucsbtime.com/api/login/redirect`.
7. **Vercel → Settings → Deployment Protection:** keep Vercel
   Authentication on for Standard Protection (the default), which covers
   every Preview including uat.ucsbtime.com.
8. Run `scripts/refresh-uat-db.sh` once to fill `sbtime-uat`.

UAT labels itself: an amber "UAT" strip on every page (a corner badge on
full-screen pages) and "[UAT]" in the tab title. The code is in `main` but only
shows on a `uat.` address, so ucsbtime.com never shows it.

Other branches still get Preview deploys, but with no database settings
their backend won't start; use `uat` for anything that needs data.

## GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions → New repository
secret:

| Name                                                                | Value                        |
| ------------------------------------------------------------------- | ---------------------------- |
| `MONGODB_URI`                                                       | the Atlas connection string  |
| `UCSB_API_KEY`                                                      | the UCSB developer API key   |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | as above (seat-alert emails) |

Run any puller by hand from the Actions tab → Data pullers → Run workflow.

The schedule itself is a Cloudflare Worker,
[`infra/cloudflare/puller-trigger`](../infra/cloudflare/puller-trigger/README.md),
that starts the workflow every 15 minutes (and twice a day and daily for the
other pullers). GitHub's built-in schedule dropped most runs. The Worker
needs a GitHub token limited to this repository's Actions; when that token
expires, the pullers stop until it's replaced.

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
