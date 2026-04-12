const META_API_BASE = 'https://graph.facebook.com/v21.0';
export const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID ?? 'act_933017306388057';

interface MetaFetchOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public raw: unknown
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

export async function metaFetch<T>(
  endpoint: string,
  options: MetaFetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is not set');

  const url = new URL(`${META_API_BASE}/${endpoint.replace(/^\//, '')}`);
  url.searchParams.set('access_token', token);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const init: RequestInit = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);
  const json = await res.json();

  if (json.error) {
    console.error('[Meta API] Error on', endpoint, '| body:', JSON.stringify(body ?? {}));
    console.error('[Meta API] Response:', JSON.stringify(json.error));
    throw new MetaApiError(
      json.error.message ?? 'Meta API error',
      json.error.code ?? res.status,
      json.error
    );
  }

  return json as T;
}
