import 'server-only';

const DEFAULT_TIMEOUT_MS = 1500;

function resolveAccessBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ACCESS_API_URL || process.env.ACCESS_API_URL || 'http://localhost:8085';
}

export async function isAccessServiceHealthy(options?: { timeoutMs?: number }): Promise<boolean> {
  const baseUrl = resolveAccessBaseUrl().replace(/\/+$/, '');
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as null | { status?: string };
    return data?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

