import http from "http";

import { Config } from "../../../../packages/common/src/utils/config";
import log from "../lib/logger";
import { configureApp } from "./app";

/** Docker and local development: start up fully, then listen on a port. */
export default async (config: Config) => {
  const { app, ready } = configureApp();
  await ready;

  const httpServer = http.createServer(app);

  httpServer.listen(config.port);

  log.info(
    { port: config.port, path: config.backendPath },
    "Server ready (Docker network)"
  );
  log.info(
    { port: 3000, path: config.backendPath },
    "Server ready (host network)"
  );
};

/** 
// Cache warming server bootstrap
export async function bootstrapCacheWarmingServer(config: Config) {
  const app = express();
  app.use(express.json());

  const { redis } = await loadCacheWarmingDependencies();
  cacheRoutes(app, redis);

  const httpServer = http.createServer(app);
  httpServer.listen(config.cacheWarmingPort);

  log.info(
    { port: config.cacheWarmingPort, path: "/cache" },
    "Cache warming server ready"
  );
}
**/
