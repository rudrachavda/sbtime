# SBTime

A course discovery and planning tool for UC Santa Barbara students, at [ucsbtime.com](https://ucsbtime.com). It brings UCSB's class schedule, grade distributions, enrollment history and degree requirements into one place.

SBTime is an independent student project and is not affiliated with or endorsed by UC Santa Barbara.

## Features

- **Catalog:** every class by quarter, with times, rooms, instructors, seats, final exams, prerequisites, GE areas and cross-listings.
- **Scheduler:** build schedules, or generate ones that fit your classes and time preferences.
- **Grades:** grade distributions by course, quarter and instructor.
- **Enrollment:** how fast classes filled in past quarters, and seat counts for the current one.
- **GradTrak:** plan your degree quarter by quarter and check it against requirements (UCSB-wide requirements, College of Engineering GEs and the Engineering majors so far).
- **Seat alerts:** an email when a seat opens in a class you're watching.

## Data sources

- Classes, sections, seats and final exams: UCSB's [Academic Curriculums API](https://developer.ucsb.edu).
- Full titles and prerequisites: the UCSB General Catalog.
- Grade distributions: public records data published by the [Daily Nexus](https://dailynexus.com).
- Enrollment history before SBTime started recording: [UCSBPlat](https://ucsbplat.com).
- Engineering requirements: the College of Engineering's GEAR (2026-27), plus the ECE and CS departments' track and science elective lists.

Course data can be out of date or wrong. Always confirm with GOLD, the General Catalog and your advisor.

## Running it locally

You need Docker and Node 22 or newer.

1. Install packages:
   ```bash
   npm install
   ```
2. Create your environment file and fill in its generated secrets:
   ```bash
   cp .env.template .env
   node scripts/initialize-local-env.mjs
   ```
3. Add a UCSB API key to `.env` as `UCSB_API_KEY`. Get one free at [developer.ucsb.edu](https://developer.ucsb.edu).
4. Start the app:
   ```bash
   docker compose up -d
   ```
   The site runs at http://localhost:3000. Use the dev login in the top bar to sign in without Google.
5. Load the data. Each puller writes to the local MongoDB; run them in this order:
   ```bash
   scripts/run-puller.sh terms-all
   scripts/run-puller.sh catalog-backfill
   scripts/run-puller.sh catalog-details
   scripts/run-puller.sh grades-nexus
   scripts/run-puller.sh finals-active
   scripts/run-puller.sh plan-requirements
   ```
   `catalog-backfill` reads every quarter since Fall 2015 and takes a while. For only the current and upcoming quarters, run `catalog-active` instead.
6. Optionally, keep data fresh: the scheduler updates seat counts every 15 minutes and the catalog twice a day.
   ```bash
   docker compose --profile pullers up -d datapuller-scheduler
   ```

### Optional settings in `.env`

- **Google sign-in:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from a Google Cloud OAuth client (Web application) with the redirect URI `http://localhost:3000/api/login/redirect`.
- **Email (seat alerts):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM`. Leave `SMTP_HOST` empty to turn email off.
- **Links in emails:** `SITE_URL`, the site's public address (defaults to http://localhost:3000).

After editing `.env`, recreate the services that read it, for example `docker compose up -d --force-recreate backend`.

Security-sensitive GraphQL changes must follow the
[public GraphQL trust-boundary guide](docs/security/public-graphql-boundary.md).

## Credits

SBTime is built on [Berkeleytime](https://github.com/asuc-octo/berkeleytime), created by [Yuxin Zhu](http://yuxinzhu.com/) and [Noah Gilmore](https://noahgilmore.com) and maintained by [the ASUC Office of the CTO](https://octo.asuc.org/). It is released under the same MIT License; see [LICENSE](LICENSE).

## Contact

rudrachavda@ucsb.edu
