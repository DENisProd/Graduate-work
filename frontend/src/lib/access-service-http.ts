'use client';

import { env } from '@/config/env.config';
import { useUserStore } from '@/store/user-store';

class AccessServiceHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AccessServiceHttpError';
  }
}

function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('smart-home-language');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.locale || 'en';
    }
  } catch {
  }
  return 'en';
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const storeToken = useUserStore.getState().accessToken;
  if (storeToken) return storeToken;
  const keys = ['keycloak-token', 'access_token', 'token', 'smart-home-token'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (parsed?.access_token) return parsed.access_token;
      if (parsed?.accessToken) return parsed.accessToken;
      if (parsed?.token) return parsed.token;
    } catch {
      return raw;
    }
  }
  return null;
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return useUserStore.getState().user?.id ?? null;
}

type AccessRequestInit = RequestInit & { signal?: AbortSignal };

export async function accessServiceRequest<T>(
  endpoint: string,
  options?: AccessRequestInit
): Promise<T> {
  const url = `${env.ACCESS_API_BASE_URL}${endpoint}`;
  const locale = getCurrentLocale();
  const token = getAuthToken();
  const userId = getCurrentUserId();
  const displayName = useUserStore.getState().user?.name?.trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': locale,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers['X-User-Id'] = userId;
  if (displayName != null && displayName.length > 0) {
    headers['X-User-Display-Name'] = encodeURIComponent(displayName);
  }
  if (options?.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
    const extra = options.headers as Record<string, string>;
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null) headers[k] = String(v);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        const text = await response.text();
        if (text) {
          const parsed = JSON.parse(text) as unknown;
          if (parsed && typeof parsed === 'object') {
            errorData = parsed as Record<string, unknown>;
          }
        }
      } catch {
      }
      const message = errorData['message'];
      const err = errorData['error'];
      const errorMessage =
        (typeof message === 'string' && message) ||
        (typeof err === 'string' && err) ||
        `HTTP ${response.status}: ${response.statusText}` ||
        'Internal Server Error';
      throw new AccessServiceHttpError(errorMessage, response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    }

    return {} as T;
  } catch (error) {
    if (error instanceof AccessServiceHttpError) {
      throw error;
    }
    throw new AccessServiceHttpError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}
