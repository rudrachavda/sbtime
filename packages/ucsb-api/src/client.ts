/**
 * Minimal client for UCSB's public developer API (https://developer.ucsb.edu).
 * Every request is authenticated with the app's consumer key in the
 * `ucsb-api-key` header.
 */

export const UCSB_API_BASE_URL = "https://api.ucsb.edu";

export class UcsbApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string
  ) {
    super(`UCSB API request failed (${status}) for ${path}`);
    this.name = "UcsbApiError";
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface UcsbClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Injectable for tests. Defaults to the global fetch. */
  fetch?: typeof fetch;
}

export class UcsbClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor({ apiKey, baseUrl, fetch: fetchImpl }: UcsbClientOptions) {
    if (!apiKey) throw new Error("A UCSB API key is required.");

    this.apiKey = apiKey;
    this.baseUrl = baseUrl ?? UCSB_API_BASE_URL;
    this.fetchImpl = fetchImpl ?? fetch;
  }

  async get<T>(path: string, query: QueryParams = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);

    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(name, String(value));
    }

    const response = await this.fetchImpl(url, {
      headers: {
        accept: "application/json",
        "ucsb-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      // Keep the body short: UCSB returns full stack traces on server errors.
      const body = (await response.text()).slice(0, 500);
      throw new UcsbApiError(response.status, url.pathname, body);
    }

    return (await response.json()) as T;
  }
}
