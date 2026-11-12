// sort-imports-ignore
//
// Vercel entrypoint. Vercel's Express support looks for src/index.ts and
// runs the default-exported app as a serverless function; it never calls
// listen. Local development and Docker use main.ts instead.
//
// OTel instrumentation must be the first import (see main.ts). It does
// nothing unless OTEL_EXPORTER_OTLP_ENDPOINT is set. The comment above keeps
// the import sorter from moving it.
import "./instrumentation";

import { createApp } from "./bootstrap/app";

const { app } = createApp();

export default app;
