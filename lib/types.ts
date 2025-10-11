export interface Vehicle {
  id: string;
  slug?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Manual' | 'Automatic' | 'CVT' | 'DSG Automatic';
  bodyType: 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Hatchback' | 'Van';
  color: string;
  engineSize: string;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | '4WD' | 'Quattro AWD';
  features: string[];
  images: string[];
  description: string;
  featured: boolean;
  status: 'Available' | 'Sold' | 'Reserved' | 'I Disponueshëm' | 'I Shitur' | 'I Rezervuar';
  vin?: string;
  doors?: number;
  seats?: number;
  mpgCity?: number;
  mpgHighway?: number;
  facebook_order?: number;
  searchScore?: number;
  viewCount?: number;
  daysOnLot?: number;
  inquiries?: any[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
}