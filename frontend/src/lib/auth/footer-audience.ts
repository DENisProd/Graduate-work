export type FooterAudience = 'guest' | 'user' | 'platformAdmin';

export const AUDIENCE_ALL: readonly FooterAudience[] = ['guest', 'user', 'platformAdmin'];
export const AUDIENCE_AUTHENTICATED: readonly FooterAudience[] = ['user', 'platformAdmin'];
export const AUDIENCE_PLATFORM_ADMIN: readonly FooterAudience[] = ['platformAdmin'];
export const AUDIENCE_GUEST_ONLY: readonly FooterAudience[] = ['guest'];

export function isFooterLinkVisible(
  visibleFor: readonly FooterAudience[],
  current: FooterAudience,
): boolean {
  return visibleFor.includes(current);
}
