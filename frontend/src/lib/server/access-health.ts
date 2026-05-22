import 'server-only';

const DEFAULT_TIMEOUT_MS = 3000;

export async function isAccessServiceHealthy(options?: { timeoutMs?: number }): Promise<boolean> {
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4001';
  const url = `${gatewayUrl}/health`;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`[health] GET ${url}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const text = await res.text().catch(() => '');
    console.log(`[health] status=${res.status} body=${text.slice(0, 200)}`);
    if (!res.ok) return false;
    const data = (JSON.parse(text || 'null')) as null | { status?: string };
    return data?.status === 'ok';
  } catch (err) {
    console.error(`[health] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

