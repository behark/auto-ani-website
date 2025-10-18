import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://autosalonani.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/vehicles',
          '/about',
          '/services',
          '/contact',
          '/trade-in',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/studio/',
          '*.json',
          '/*?*', // Query parameters
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}