'use client';

import { env } from '@/config/env.config';
import { useUserStore } from '@/store/user-store';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
export const API_BASE_URL = env.API_BASE_URL;
export const ACCESS_API_BASE_URL = env.ACCESS_API_BASE_URL;
export const PHYSICAL_DEVICES_API_BASE_URL = env.PHYSICAL_DEVICES_API_BASE_URL;

export type ApiCallOptions = RequestInit & { baseUrl?: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
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
    // fallback
  }
  return 'en';
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
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

function getOptionalUserDisplayNameHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const name = useUserStore.getState().user?.name?.trim();
  if (!name) return {};
  return { 'X-User-Display-Name': encodeURIComponent(name) };
}

export async function apiCall<T>(endpoint: string, options?: ApiCallOptions): Promise<T> {
  const { baseUrl, ...requestOptions } = options || {};
  const url = `${baseUrl ?? API_BASE_URL}${endpoint}`;
  const locale = getCurrentLocale();
  const token = getAuthToken();
  const userId = getCurrentUserId();
  const isAccessService = (baseUrl ?? API_BASE_URL) === ACCESS_API_BASE_URL;

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'X-User-Id': userId } : {}),
        ...(isAccessService ? getOptionalUserDisplayNameHeader() : {}),
        ...requestOptions.headers,
      },
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
        // ignore parse errors
      }

      const message = errorData['message'];
      const error = errorData['error'];
      const errorMessage =
        (typeof message === 'string' && message) ||
        (typeof error === 'string' && error) ||
        `HTTP ${response.status}: ${response.statusText}` ||
        'Internal Server Error';

      throw new ApiError(errorMessage, response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) return {} as T;
      return JSON.parse(text);
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      if (USE_MOCKS && error.status >= 500) {
        console.warn(`API returned ${error.status} error.`);
      }
      throw error;
    }
    if (!USE_MOCKS && error instanceof TypeError) {
      console.warn('API request failed. Consider setting NEXT_PUBLIC_USE_MOCKS=true to use mock data.');
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error', 0, error);
  }
}

export const accessApiCall = <T>(endpoint: string, options?: ApiCallOptions) =>
  apiCall<T>(endpoint, { ...options, baseUrl: ACCESS_API_BASE_URL });

export const physicalDevicesApiCall = <T>(endpoint: string, options?: ApiCallOptions) =>
  apiCall<T>(endpoint, { ...options, baseUrl: PHYSICAL_DEVICES_API_BASE_URL });

export async function safeApiCall<T>(apiCallFn: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) return mockFn();
  return apiCallFn();
}

export function buildPageQuery(params?: { page?: number; size?: number; sort?: string }): string {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.append('page', params.page.toString());
  if (params?.size !== undefined) q.append('size', params.size.toString());
  if (params?.sort) q.append('sort', params.sort);
  const s = q.toString();
  return s ? `?${s}` : '';
}
