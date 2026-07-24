/**
 * Public identity and contact details for sabiqgame.com.
 *
 * Keep the static schema in src/index.html aligned with these values because
 * Angular templates cannot interpolate into that document before bootstrap.
 */
export const SITE_IDENTITY = {
  nameArabic: 'سابق',
  siteUrl: 'https://sabiqgame.com',
  domain: 'sabiqgame.com',
  contacts: {
    support: 'support@sabiqgame.com',
    privacy: 'privacy@sabiqgame.com',
    legal: 'legal@sabiqgame.com'
  }
} as const;
