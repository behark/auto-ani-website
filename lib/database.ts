/**
 * Database Client with Connection Pooling
 *
 * This module provides a unified database client that supports:
 * - SQLite for local development
 * - PostgreSQL with connection pooling for production
 * - Automatic connection management and health monitoring
 * - Query performance tracking
 */

// Import OpenSSL compatibility fix for Render
import './prisma-fix';

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Connection pool disabled for Netlify deployment
// Netlify's serverless functions handle connection pooling automatically
let connectionPool: any = null;

declare global {
  // Prevent multiple instances of Prisma Client in development
  var __prisma: PrismaClient | undefined;
}

// Import validated env
import { env, isProduction } from './env';

// Determine database provider from environment
const getDatabaseProvider = () => {
  return env.DATABASE_PROVIDER;
};

// Get appropriate database URL based on provider
const getDatabaseUrl = () => {
  let url = env.DATABASE_URL;
  const provider = getDatabaseProvider();

  // For production with PostgreSQL/Neon, ensure SSL is configured
  if (isProduction && provider === 'postgresql') {
    // If the URL doesn't already contain SSL settings, add them
    if (!url.includes('sslmode=') && !url.includes('ssl=')) {
      // Add SSL mode for Neon.tech
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}sslmode=require`;
      logger.info('Added SSL mode to database URL for production');
    }
  }

  return url;
};

function getPrismaClient() {
  // In production with PostgreSQL, use connection pool
  if (connectionPool && process.env.NODE_ENV === 'production') {
    logger.info('Using connection pool for database access');
    return connectionPool.prisma || connectionPool.default;
  }

  // Standard Prisma client for development or SQLite
  if (process.env.NODE_ENV === 'development') {
    if (!globalThis.__prisma) {
      globalThis.__prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: getDatabaseUrl()
          }
        }
      });

      // Log slow queries in development
      globalThis.__prisma.$on('query' as never, (e: any) => {
        if (e.duration > 500) {
          logger.warn('Slow query detected', {
            query: e.query.substring(0, 200),
            duration: `${e.duration}ms`,
          });
        }
      });
    }
    return globalThis.__prisma;
  }

  // Production without connection pool (fallback)
  // For Netlify serverless, use the URL as-is (don't add extra connection params)
  const productionUrl = getDatabaseUrl();

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn'],
    errorFormat: 'minimal',
    datasources: {
      db: {
        url: productionUrl
      }
    },
  });

  // Set query timeout for serverless environments
  if (process.env.NODE_ENV === 'production') {
    // Add $connect timeout to ensure database connectivity
    client.$connect().catch((error) => {
      console.error('Database connection failed:', error);
    });
  }

  // Add connection timeout for production
  if (process.env.NODE_ENV === 'production') {
    logger.info('Initializing production Prisma client with Neon database');
  }

  return client;
}

export const prisma = getPrismaClient();

// Database connection health check
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  provider: string;
  latency?: number;
  error?: string;
}> {
  const provider = getDatabaseProvider();
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    // Get additional connection pool stats if available
    if (connectionPool?.getConnectionPool) {
      const pool = connectionPool.getConnectionPool();
      const health = pool.getHealthStatus();

      logger.info('Database health check passed', {
        provider,
        latency: `${latency}ms`,
        poolHealth: health
      });
    }

    return {
      connected: true,
      provider,
      latency
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.dbError('Database connection failed', error instanceof Error ? error : new Error(errorMessage));

    return {
      connected: false,
      provider,
      error: errorMessage
    };
  }
}

// Graceful shutdown helper
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database', {}, error instanceof Error ? error : undefined);
  }
}

// Database error handler
export function handleDatabaseError(error: any): {
  message: string;
  code: string;
  isUserError: boolean;
} {
  if (error.code === 'P2002') {
    return {
      message: 'A record with this information already exists',
      code: 'DUPLICATE_RECORD',
      isUserError: true,
    };
  }

  if (error.code === 'P2025') {
    return {
      message: 'Record not found',
      code: 'NOT_FOUND',
      isUserError: true,
    };
  }

  if (error.code === 'P2003') {
    return {
      message: 'Referenced record does not exist',
      code: 'FOREIGN_KEY_CONSTRAINT',
      isUserError: true,
    };
  }

  logger.dbError('Unexpected database error', error instanceof Error ? error : new Error(String(error)));

  return {
    message: 'An unexpected database error occurred',
    code: 'UNKNOWN_ERROR',
    isUserError: false,
  };
}

// Pagination helper
export function createPagination(page: number = 1, limit: number = 12) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Search helper for vehicles
export function createVehicleSearchConditions(params: {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  search?: string;
}) {
  const conditions: any = {
    AND: [
      // Only show available vehicles by default
      { status: { in: ['AVAILABLE'] } },
    ],
  };

  // Make filter
  if (params.make) {
    conditions.AND.push({ make: { equals: params.make, mode: 'insensitive' } });
  }

  // Model filter
  if (params.model) {
    conditions.AND.push({ model: { contains: params.model, mode: 'insensitive' } });
  }

  // Year range filter
  if (params.yearMin || params.yearMax) {
    const yearFilter: any = {};
    if (params.yearMin) yearFilter.gte = params.yearMin;
    if (params.yearMax) yearFilter.lte = params.yearMax;
    conditions.AND.push({ year: yearFilter });
  }

  // Price range filter
  if (params.priceMin || params.priceMax) {
    const priceFilter: any = {};
    if (params.priceMin) priceFilter.gte = params.priceMin;
    if (params.priceMax) priceFilter.lte = params.priceMax;
    conditions.AND.push({ price: priceFilter });
  }

  // Fuel type filter
  if (params.fuelType) {
    conditions.AND.push({ fuelType: params.fuelType });
  }

  // Transmission filter
  if (params.transmission) {
    conditions.AND.push({ transmission: params.transmission });
  }

  // Body type filter
  if (params.bodyType) {
    conditions.AND.push({ bodyType: params.bodyType });
  }

  // General search filter
  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    conditions.AND.push({
      OR: [
        { make: { contains: searchTerm, mode: 'insensitive' } },
        { model: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { features: { has: searchTerm } },
      ],
    });
  }

  return conditions;
}

// Sort helper for vehicles
export function createVehicleSortOrder(sortBy?: string) {
  switch (sortBy) {
    case 'price-low':
      return { price: 'asc' as const };
    case 'price-high':
      return { price: 'desc' as const };
    case 'year-new':
      return { year: 'desc' as const };
    case 'year-old':
      return { year: 'asc' as const };
    case 'mileage-low':
      return { mileage: 'asc' as const };
    case 'mileage-high':
      return { mileage: 'desc' as const };
    case 'recent':
      return { createdAt: 'desc' as const };
    default:
      // Default: featured first, then by creation date
      return [
        { featured: 'desc' as const },
        { createdAt: 'desc' as const },
      ];
  }
}

// Helper function to parse JSON fields
function parseVehicleJsonFields(vehicle: any) {
  try {
    return {
      ...vehicle,
      images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images || [],
      features: typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features || [],
    };
  } catch (error) {
    logger.warn('Failed to parse vehicle JSON fields', { vehicleId: vehicle.id, error: error instanceof Error ? error.message : String(error) });
    return {
      ...vehicle,
      images: [],
      features: [],
    };
  }
}

// Vehicle repository functions
export const VehicleRepository = {
  // Get all vehicles with filters and pagination
  async findMany(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    filters?: Parameters<typeof createVehicleSearchConditions>[0];
  }) {
    try {
      const { page = 1, limit = 12, sortBy, filters = {} } = params;
      const pagination = createPagination(page, limit);
      const where = createVehicleSearchConditions(filters);
      const orderBy = createVehicleSortOrder(sortBy);

      const [rawVehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          orderBy,
          ...pagination,
        }),
        prisma.vehicle.count({ where }),
      ]);

      // Parse JSON fields for all vehicles
      const vehicles = rawVehicles.map(parseVehicleJsonFields);

      logger.debug('VehicleRepository.findMany executed successfully', {
        page,
        limit,
        totalFound: total,
        filtersApplied: Object.keys(filters).length
      });

      return {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.dbError('Error in VehicleRepository.findMany', error instanceof Error ? error : new Error(String(error)));

      // Return graceful default on error
      return {
        vehicles: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  // Get vehicle by ID or slug
  async findByIdOrSlug(identifier: string) {
    try {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          OR: [
            { id: identifier },
            { slug: identifier },
          ],
        },
        include: {
          inquiries: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              createdAt: true,
              inquiryType: true,
            },
          },
          _count: {
            select: {
              inquiries: true,
              favorites: true,
            },
          },
        },
      });

      if (vehicle) {
        logger.debug('VehicleRepository.findByIdOrSlug found vehicle', {
          identifier,
          vehicleId: vehicle.id,
          inquiryCount: vehicle._count.inquiries
        });
        return parseVehicleJsonFields(vehicle);
      } else {
        logger.info('VehicleRepository.findByIdOrSlug - vehicle not found', { identifier });
        return null;
      }
    } catch (error) {
      logger.dbError('Error in VehicleRepository.findByIdOrSlug', error instanceof Error ? error : new Error(String(error)), identifier);
      return null;
    }
  },

  // Get featured vehicles
  async findFeatured(limit: number = 6) {
    try {
      const rawVehicles = await prisma.vehicle.findMany({
        where: {
          featured: true,
          status: { in: ['AVAILABLE', 'I_DISPONUESHEM'] },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      const vehicles = rawVehicles.map(parseVehicleJsonFields);

      logger.debug('VehicleRepository.findFeatured executed successfully', {
        limit,
        found: vehicles.length
      });

      return vehicles;
    } catch (error) {
      logger.dbError('Error in VehicleRepository.findFeatured', error instanceof Error ? error : new Error(String(error)));
      return []; // Return empty array on error
    }
  },

  // Get similar vehicles
  async findSimilar(vehicleId: string, limit: number = 4) {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { make: true, bodyType: true, price: true },
      });

      if (!vehicle) {
        logger.info('VehicleRepository.findSimilar - vehicle not found', { vehicleId });
        return [];
      }

      // Create price range for similarity matching (±20% of vehicle price)
      const priceVariation = Math.floor(vehicle.price * 0.2);
      const priceRange = {
        min: Math.max(0, vehicle.price - priceVariation),
        max: vehicle.price + priceVariation,
      };

      const rawVehicles = await prisma.vehicle.findMany({
        where: {
          AND: [
            { id: { not: vehicleId } },
            { status: { in: ['AVAILABLE'] } },
            {
              OR: [
                { make: vehicle.make },
                { bodyType: vehicle.bodyType },
                {
                  price: {
                    gte: priceRange.min,
                    lte: priceRange.max,
                  },
                },
              ],
            },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const similarVehicles = rawVehicles.map(parseVehicleJsonFields);

      logger.debug('VehicleRepository.findSimilar executed successfully', {
        vehicleId,
        vehicleMake: vehicle.make,
        vehicleBodyType: vehicle.bodyType,
        vehiclePrice: vehicle.price,
        priceRange,
        found: similarVehicles.length
      });

      return similarVehicles;
    } catch (error) {
      logger.dbError('Error in VehicleRepository.findSimilar', error instanceof Error ? error : new Error(String(error)), vehicleId);
      return []; // Return empty array on error
    }
  },
};

// Contact repository functions
export const ContactRepository = {
  // Create new contact submission
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    subject?: string;
    clientIP?: string;
    fingerprint?: string;
    userAgent?: string;
  }) {
    try {
      const contact = await prisma.contact.create({
        data,
      });

      logger.info('ContactRepository.create executed successfully', {
        contactId: contact.id,
        email: data.email,
        subject: data.subject
      });

      return contact;
    } catch (error) {
      logger.dbError('Error in ContactRepository.create', error instanceof Error ? error : new Error(String(error)));
      throw error; // Re-throw to let caller handle
    }
  },

  // Create vehicle inquiry
  async createInquiry(data: {
    vehicleId: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
    inquiryType: string;
    clientIP?: string;
    fingerprint?: string;
  }) {
    try {
      const inquiry = await prisma.vehicleInquiry.create({
        data,
      });

      logger.info('ContactRepository.createInquiry executed successfully', {
        inquiryId: inquiry.id,
        vehicleId: data.vehicleId,
        email: data.email,
        inquiryType: data.inquiryType
      });

      return inquiry;
    } catch (error) {
      logger.dbError('Error in ContactRepository.createInquiry', error instanceof Error ? error : new Error(String(error)));
      throw error; // Re-throw to let caller handle
    }
  },

  // Get recent contacts for admin
  async findRecent(limit: number = 10) {
    try {
      const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          _count: true,
        },
      });

      logger.debug('ContactRepository.findRecent executed successfully', {
        limit,
        found: contacts.length
      });

      return contacts;
    } catch (error) {
      logger.dbError('Error in ContactRepository.findRecent', error instanceof Error ? error : new Error(String(error)));
      return []; // Return empty array on error
    }
  },
};

// Default export
export default prisma;