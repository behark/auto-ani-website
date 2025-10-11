import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://autosalonani.com'

  // Static pages
  const staticPages = [
    '',
    '/vehicles',
    '/services',
    '/about',
    '/contact',
    '/financing',
    '/compare',
    '/portal',
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  // TODO: Add dynamic vehicle pages when database is available
  // This would require fetching vehicles from the database
  // const vehicleRoutes = await getVehicleSitemapRoutes()

  return staticRoutes
}