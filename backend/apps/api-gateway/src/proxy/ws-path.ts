export function rewriteProxyPath(
  pathname: string,
  pathRewrite?: Record<string, string>,
): string {
  if (!pathRewrite) return pathname;
  let result = pathname;
  for (const [pattern, replacement] of Object.entries(pathRewrite)) {
    result = result.replace(new RegExp(pattern), replacement);
  }
  return result || '/';
}

export function buildUpstreamWsPath(
  incomingUrl: string,
  target: string,
  pathRewrite?: Record<string, string>,
): string {
  const qIndex = incomingUrl.indexOf('?');
  const pathname = qIndex === -1 ? incomingUrl : incomingUrl.slice(0, qIndex);
  const search = qIndex === -1 ? '' : incomingUrl.slice(qIndex);

  const targetUrl = new URL(target);
  const targetPath = targetUrl.pathname;
  const rewritten = rewriteProxyPath(pathname, pathRewrite);

  const finalPath =
    targetPath && targetPath !== '/' ? targetPath : rewritten;

  return (finalPath || '/') + search;
}
