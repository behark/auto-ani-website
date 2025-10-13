// Route-specific types for AUTO ANI API

// Vehicle types
export interface Vehicle {
  id: string
  slug: string | null
  make: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  transmission: string
  bodyType: string
  color: string
  engineSize: string
  drivetrain: string
  features: string // JSON string
  images: string // JSON string
  description: string
  featured: boolean
  status: string
  vin: string | null
  doors: number | null
  seats: number | null
  createdAt: Date
  updatedAt: Date
}

export interface VehicleFilters {
  makes: string[]
  models: string[]
  years: number[]
  bodyTypes: string[]
  fuelTypes: string[]
  transmissions: string[]
  priceRange: { min: number; max: number }
  mileageRange: { min: number; max: number }
}

// Vehicle API responses
export interface GetVehiclesResponse {
  vehicles: Vehicle[]
  total: number
  pagination: {
    total: number
    count: number
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface GetVehicleByIdResponse {
  vehicle: Vehicle
  similarVehicles: Partial<Vehicle>[]
}

export interface CreateVehicleRequest {
  make: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  transmission: string
  bodyType: string
  color: string
  engineSize: string
  drivetrain: string
  features?: string[]
  images?: string[]
  description?: string
  featured?: boolean
  status?: string
  vin?: string
  doors?: number
  seats?: number
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  id: string
}

// Appointment types
export type AppointmentType = 'TEST_DRIVE' | 'INSPECTION' | 'SERVICE' | 'CONSULTATION' | 'DELIVERY'
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type ReminderMethod = 'EMAIL' | 'SMS' | 'PUSH'

export interface Appointment {
  id: string
  type: AppointmentType
  vehicleId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  scheduledDate: Date
  scheduledTime: string
  duration: number
  status: AppointmentStatus
  notes: string | null
  reminderMethod: ReminderMethod | null
  reminderSent: boolean
  confirmationSent: boolean
  location: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAppointmentRequest {
  type: AppointmentType
  vehicleId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  scheduledDate: string // YYYY-MM-DD format
  scheduledTime: string // HH:MM format
  duration: number
  notes?: string
  reminderMethod?: ReminderMethod
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus
  notes?: string
}

export interface AppointmentAvailabilitySlot {
  time: string
  available: boolean
  duration: number
}

export interface GetAppointmentsAvailabilityResponse {
  availability: AppointmentAvailabilitySlot[]
  businessHours: {
    open: string
    close: string
  }
}

export interface GetAppointmentsResponse {
  appointments: Appointment[]
}

export interface CreateAppointmentResponse {
  appointment: Appointment
  message: string
}

// Contact form types
export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  subject: string | null
  status: string
  clientIP: string | null
  fingerprint: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ContactFormRequest {
  name: string
  email: string
  phone?: string
  message: string
  vehicleId?: string
  honeypot?: string // Should be empty
  captcha: string
  consent: boolean
  csrfToken: string
}

export interface ContactFormResponse {
  message: string
  submissionId: string
}

// Trade-in valuation types
export type TradeInStatus = 'SUBMITTED' | 'REVIEWING' | 'APPRAISED' | 'OFFERED' | 'ACCEPTED' | 'DECLINED'
export type VehicleCondition = 'excellent' | 'very_good' | 'good' | 'fair' | 'poor'

export interface TradeInValuation {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  vehicleMileage: number
  vehicleCondition: VehicleCondition
  vehiclePhotos: string | null // JSON array
  hasAccidents: boolean
  hasServiceHistory: boolean
  marketValue: number | null
  offerValue: number | null
  status: TradeInStatus
  appraisedBy: string | null
  notes: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTradeInRequest {
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  vehicleMileage: number
  vehicleCondition: VehicleCondition
  hasAccidents?: boolean
  hasServiceHistory?: boolean
  vehiclePhotos?: string[]
  additionalInfo?: string
}

export interface GetTradeInValuationsResponse {
  valuations: TradeInValuation[]
  total: number
}

export interface CreateTradeInResponse {
  valuation: Partial<TradeInValuation>
  estimatedValue: number
  marketValue: number
  message: string
}

// Promotion types
export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BOGO'

export interface PromotionConditions {
  minAmount?: number
  maxAmount?: number
  applicableVehicles?: string[]
  applicableParts?: string[]
  customerSegments?: string[]
  maxUses?: number
  maxUsesPerCustomer?: number
}

export interface Promotion {
  id: string
  name: string
  description: string
  type: PromotionType
  value: number
  startDate: string
  endDate: string
  conditions?: PromotionConditions
  isActive: boolean
  createdAt: string
  usage?: PromotionUsageStats
}

export interface PromotionUsageStats {
  totalUses: number
  totalRevenue: number
  conversionRate: number
}

export interface CreatePromotionRequest {
  name: string
  description: string
  type: PromotionType
  value: number
  startDate: string
  endDate: string
  conditions?: PromotionConditions
}

export interface GetPromotionsResponse {
  promotions: Promotion[]
}

export interface CreatePromotionResponse {
  promotion: Promotion
}

// Inventory alert types
export interface InventoryAlert {
  id: string
  customerEmail: string
  customerName: string | null
  vehicleMake: string | null
  vehicleModel: string | null
  maxPrice: number | null
  minYear: number | null
  maxMileage: number | null
  bodyType: string | null
  fuelType: string | null
  isActive: boolean
  lastNotified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateInventoryAlertRequest {
  customerEmail: string
  customerName?: string
  vehicleMake?: string
  vehicleModel?: string
  maxPrice?: number
  minYear?: number
  maxMileage?: number
  bodyType?: string
  fuelType?: string
}

export interface GetInventoryAlertsResponse {
  alerts: InventoryAlert[]
  total: number
}

// Testimonial types
export interface Testimonial {
  id: string
  vehicleId: string | null
  customerName: string
  customerEmail: string | null
  rating: number
  title: string | null
  content: string
  photos: string | null // JSON array
  isVerified: boolean
  isApproved: boolean
  isPublic: boolean
  location: string | null
  purchaseDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTestimonialRequest {
  vehicleId?: string
  customerName: string
  customerEmail?: string
  rating: number
  title?: string
  content: string
  photos?: string[]
  location?: string
  purchaseDate?: string
}

// Blog post types
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  images: string | null // JSON array
  author: string
  category: string
  tags: string | null // JSON array
  isPublished: boolean
  publishedAt: Date | null
  seoTitle: string | null
  seoDescription: string | null
  views: number
  createdAt: Date
  updatedAt: Date
}

export interface GetBlogPostsResponse {
  posts: BlogPost[]
  total: number
  pagination?: {
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Settings types
export interface Setting {
  key: string
  value: string
  category: string
  createdAt: Date
  updatedAt: Date
}

// Search types
export interface VehicleSearchFilters {
  query?: string
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  minMileage?: number
  maxMileage?: number
  bodyType?: string
  fuelType?: string
  transmission?: string
  color?: string
  featured?: boolean
  status?: string
}

export interface SearchVehiclesResponse {
  vehicles: Vehicle[]
  total: number
  filters: VehicleFilters
  pagination: {
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Admin notification types
export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  data: string | null // JSON
  read: boolean
  createdAt: Date
}

export interface GetAdminNotificationsResponse {
  notifications: AdminNotification[]
  unreadCount: number
}
