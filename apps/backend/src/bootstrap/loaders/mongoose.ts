import { attachDatabasePool } from "@vercel/functions";
import mongoose from "mongoose";

import { config } from "../../../../../packages/common/src/utils/config";

// Close the Mongoose default connection is the event of application termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// On Vercel every function instance opens its own pool, and a deploy starts
// many instances at once. Without limits each could hold up to 100
// connections and keep them after Vercel pauses it, so a few deploys in a row
// neared the Atlas cluster's 500-connection limit. Keep each pool small and
// close connections that sit idle.
const POOL_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 5000,
} satisfies mongoose.ConnectOptions;

export default async (): Promise<mongoose.Mongoose> => {
  const connection = await mongoose.connect(config.mongoDB.uri, POOL_OPTIONS);

  // Lets Vercel release the idle connections before it pauses the instance
  // (does nothing outside Vercel)
  attachDatabasePool(connection.connection.getClient());

  return connection;
};
