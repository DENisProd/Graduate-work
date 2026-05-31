export type FooterAudience = 'guest' | 'user' | 'platformAdmin';

export function isFooterLinkVisible(
  visibleFor: readonly FooterAudience[],
  current: FooterAudience,
): boolean {
  return visibleFor.includes(current);
}
