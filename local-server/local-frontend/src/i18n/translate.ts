function getNested(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number | undefined>,
): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : '',
  )
}

export function createTranslator(messages: Record<string, unknown>) {
  return (key: string, vars?: Record<string, string | number | undefined>): string => {
    const raw = getNested(messages, key)
    const str = typeof raw === 'string' ? raw : key
    return interpolate(str, vars)
  }
}
