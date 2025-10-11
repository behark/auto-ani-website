import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Vetura në Shitje | AUTO ANI - Direct Database Access",
  description: "Vehicles loaded directly from database bypassing Prisma for testing"
};

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  status: string;
  featured: boolean;
  description?: string;
  images?: string[];
  location?: string;
}

async function getVehiclesDirect() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';
    const response = await fetch(`${baseUrl}/api/vehicles-direct`, {
      cache: 'no-store' // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    return data.vehicles || [];
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    return [];
  }
}

export default async function VehiclesDirectPage() {
  const vehicles = await getVehiclesDirect();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vetura në Shitje (Direct Database)
          </h1>
          <p className="text-gray-600">
            Loaded directly from PostgreSQL - bypassing Prisma OpenSSL issues
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              🔧 <strong>Debug Mode:</strong> This page uses direct PostgreSQL connection instead of Prisma
            </p>
            <Link href="/vehicles" className="text-blue-600 hover:underline">
              ← Back to main vehicles page
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg font-semibold">
            Found {vehicles.length} vehicles
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                No vehicles found
              </h3>
              <p className="text-yellow-700">
                The database connection works, but there are no vehicles in the database yet.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                You may need to run the database seed script to add sample vehicles.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle: Vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.featured && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">
                    {vehicle.year} • {vehicle.mileage?.toLocaleString()} km
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Fuel:</span> {vehicle.fuelType}
                    </div>
                    <div>
                      <span className="font-medium">Transmission:</span> {vehicle.transmission}
                    </div>
                    <div>
                      <span className="font-medium">Body:</span> {vehicle.bodyType}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {vehicle.status}
                    </div>
                  </div>

                  {vehicle.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {vehicle.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-orange-600">
                      €{vehicle.price?.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {vehicle.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}