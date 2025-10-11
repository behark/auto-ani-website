import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AUTO ANI - Premium Auto Salon',
    short_name: 'AUTO ANI',
    description: 'Premium auto salon in Pristina, Kosovo. Over 2500 vehicles sold since 2015.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    categories: ['automotive', 'business', 'shopping'],
    lang: 'sq',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    shortcuts: [
      {
        name: 'Browse Vehicles',
        short_name: 'Vehicles',
        description: 'Browse our vehicle inventory',
        url: '/vehicles',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Contact Us',
        short_name: 'Contact',
        description: 'Get in touch with us',
        url: '/contact',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192'
          }
        ]
      }
    ]
  }
}