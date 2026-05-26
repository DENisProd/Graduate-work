export function normalizeApiList<T>(result: unknown): { items: T[]; total: number } {
  if (Array.isArray(result)) {
    return { items: result as T[], total: result.length };
  }
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return {
        items: obj.items as T[],
        total: typeof obj.total === 'number' ? obj.total : (obj.items as T[]).length,
      };
    }
    if (Array.isArray(obj.data)) {
      return {
        items: obj.data as T[],
        total: typeof obj.total === 'number' ? obj.total : (obj.data as T[]).length,
      };
    }
    if (Array.isArray(obj.content)) {
      return {
        items: obj.content as T[],
        total:
          typeof obj.totalElements === 'number'
            ? obj.totalElements
            : (obj.content as T[]).length,
      };
    }
  }
  return { items: [] as T[], total: 0 };
}
