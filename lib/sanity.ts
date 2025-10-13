import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'dummy-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true, // Enable for faster, cached responses
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// GROQ queries for vehicles
export const VEHICLE_QUERIES = {
  all: `*[_type == "vehicle"] | order(_createdAt desc)`,
  bySlug: `*[_type == "vehicle" && slug.current == $slug][0]`,
  featured: `*[_type == "vehicle" && featured == true] | order(_createdAt desc)`,
  byCategory: `*[_type == "vehicle" && category == $category] | order(_createdAt desc)`,
}

// TypeScript types
export interface Vehicle {
  _id: string
  _type: 'vehicle'
  title: string
  slug: { current: string }
  brand: string
  model: string
  year: number
  price: number
  mileage?: number
  category: 'new' | 'used' | 'certified'
  featured?: boolean
  description?: string
  specifications?: {
    engine?: string
    transmission?: string
    fuelType?: string
    drivetrain?: string
    color?: string
  }
  images?: Array<{
    asset: {
      _ref: string
      _type: 'reference'
    }
    alt?: string
  }>
  _createdAt: string
  _updatedAt: string
}