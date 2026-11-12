import { RedisClientType, createClient } from "redis";

import { config } from "../../../../../packages/common/src/utils/config";
import log from "../../lib/logger";

export default async (): Promise<RedisClientType> => {
  const client = createClient({
    url: config.redisUri,
  });

  // Without a listener, a Redis "error" event is fatal: it ends the process,
  // which on Vercel fails every request. Log it instead; the client
  // reconnects on its own (Upstash closes idle connections, for example).
  client.on("error", (error: Error) => {
    log.error({ error: error.message }, "Redis connection error");
  });

  // The client retries forever, so give the first connection a deadline:
  // a wrong REDIS_URI then fails start-up with a clear error instead of
  // leaving every request waiting.
  let timer: NodeJS.Timeout | undefined;
  await Promise.race([
    client.connect(),
    new Promise((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              "Could not connect to Redis within 15 seconds; check REDIS_URI"
            )
          ),
        15_000
      );
    }),
  ]).finally(() => clearTimeout(timer));

  return client as RedisClientType;
};
