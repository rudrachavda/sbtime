import express, { type Application } from "express";

import log from "../lib/logger";
import loaders from "./loaders";

/**
 * Builds the backend app. Used two ways:
 *
 * - main.ts (Docker and local development) waits for `ready`, then listens
 *   on a port.
 * - index.ts (Vercel) exports `app` straight away. Vercel starts the app on
 *   the first request, so requests wait on `ready` (connecting to MongoDB
 *   and Redis, loading Apollo) before reaching the routes.
 */
export const createApp = (): { app: Application; ready: Promise<void> } => {
  const app = express();
  app.set("trust proxy", 1);

  // log http requests
  app.use((req, res, next) => {
    if (
      req.path === "/healthz" ||
      req.path === "/health" ||
      req.path === "/ready"
    ) {
      return next();
    }
    const start = performance.now(); //start time
    res.on("finish", () => {
      const duration = Math.round(performance.now() - start); //duration (end time - start time)
      log.info(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get("user-agent"),
        },
        "http request"
      );
    });
    next();
  });

  app.get("/healthz", (_, res) => {
    res.status(200).send("OK");
  });

  const ready = loaders(app);
  ready.catch((error) => log.error({ error }, "Backend failed to start"));

  // Routes are added at the end of start-up, so hold requests until then.
  app.use((_req, res, next) => {
    ready.then(
      () => next(),
      () => res.status(503).send("Service unavailable")
    );
  });

  return { app, ready };
};
