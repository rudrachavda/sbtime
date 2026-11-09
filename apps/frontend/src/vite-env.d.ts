/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OTel collector OTLP endpoint path, e.g. "/otlp". Unset = tracing disabled. */
  readonly VITE_OTEL_ENDPOINT?: string;
  /** Mapbox public access token (pk.…). Set in apps/frontend/.env. */
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
