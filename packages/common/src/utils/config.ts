import dotenv from "dotenv";

dotenv.config();

// Safely get the environment variable in the process
const env = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing: process.env['${name}'].`);
  }

  return value;
};

const envOptional = (name: string): string | undefined => process.env[name];

// For settings with a sensible value everywhere, or that SBTime doesn't use
// (Berkeley's SIS and S3 sources, the semantic-search service), so a host
// only needs the real secrets.
const envDefault = (name: string, fallback: string): string =>
  process.env[name] || fallback;

export interface Config {
  port: number;
  cacheWarmingPort: number;
  url: string;
  backendPath: string;
  /** Full public URL of the backend (e.g. https://ucsbtime.com/api). Required in production for OAuth callback. */
  backendPublicUrl: string | undefined;
  graphqlPath: string;
  isDev: boolean;
  /** UAT only: allow the DEV "Select User" sign-in (DEV_AUTH_ENABLED=true). */
  devAuthEnabled: boolean;
  semanticSearch: {
    url: string;
  };
  mongoDB: {
    uri: string;
  };
  sis: {
    CLASS_APP_ID: string;
    CLASS_APP_KEY: string;
    COURSE_APP_ID: string;
    COURSE_APP_KEY: string;
    TERM_APP_ID: string;
    TERM_APP_KEY: string;
  };
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  redisUri: string;
  s3: {
    imagesAccessUrl: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// All your secrets, keys go here
export const config: Config = {
  port: +envDefault("PORT", "5001"),
  cacheWarmingPort: +envDefault("CACHE_WARMING_PORT", "8080"),
  url: env("URL"),
  backendPath: envDefault("BACKEND_PATH", "/api"),
  backendPublicUrl: envOptional("BACKEND_PUBLIC_URL"),
  graphqlPath: envDefault("GRAPHQL_PATH", "/graphql"),
  // Unset counts as production. Hosts such as Vercel should leave it unset:
  // NODE_ENV=production during a build makes npm skip devDependencies.
  isDev: process.env.NODE_ENV === "development",
  // Set only for the uat branch in Vercel. Never set it for production.
  devAuthEnabled: process.env.DEV_AUTH_ENABLED === "true",
  semanticSearch: {
    // Not deployed; requests to it fail at once.
    url: envDefault("SEMANTIC_SEARCH_URL", "http://localhost:1"),
  },
  mongoDB: {
    uri: env("MONGODB_URI"),
  },
  sis: {
    CLASS_APP_ID: envDefault("SIS_CLASS_APP_ID", ""),
    CLASS_APP_KEY: envDefault("SIS_CLASS_APP_KEY", ""),
    COURSE_APP_ID: envDefault("SIS_COURSE_APP_ID", ""),
    COURSE_APP_KEY: envDefault("SIS_COURSE_APP_KEY", ""),
    TERM_APP_ID: envDefault("SIS_TERM_APP_ID", ""),
    TERM_APP_KEY: envDefault("SIS_TERM_APP_KEY", ""),
  },
  SESSION_SECRET: env("SESSION_SECRET"),
  GOOGLE_CLIENT_ID: env("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: env("GOOGLE_CLIENT_SECRET"),
  redisUri: env("REDIS_URI"),
  s3: {
    imagesAccessUrl: envDefault("S3_IMAGES_ACCESS_URL", ""),
    endpoint: envDefault("S3_ENDPOINT", ""),
    accessKeyId: envDefault("S3_ACCESS_KEY_ID", ""),
    secretAccessKey: envDefault("S3_SECRET_ACCESS_KEY", ""),
  },
};
