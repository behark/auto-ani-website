import { notFound } from "next/navigation";
import Image from "next/image";
import { client, urlFor } from "@/lib/sanity";
import { Vehicle } from "@/lib/sanity";
import ContactForm from "@/components/ContactForm";

interface PageProps {
  params: { slug: string };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  // Fetch vehicle by slug (not _id)
  const vehicle = await client.fetch<Vehicle>(
    `*[_type == "vehicle" && slug.current == $slug][0]{
      _id,
      title,
      brand,
      model,
      year,
      price,
      mileage,
      fuelType,
      transmission,
      category,
      description,
      mainImage,
      gallery,
      slug,
      color,
      engine,
      drivetrain,
      features
    }`,
    { slug: params.slug }
  );

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicle Images */}
        <div>
          <div className="relative h-96 mb-4 rounded-lg overflow-hidden">
            <Image
              src={vehicle.mainImage ? urlFor(vehicle.mainImage).url() : "/placeholder.jpg"}
              alt={vehicle.title || `${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Gallery */}
          {vehicle.gallery && vehicle.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {vehicle.gallery.map((image, index) => (
                <div key={index} className="relative h-24 rounded overflow-hidden">
                  <Image
                    src={urlFor(image).url()}
                    alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div>
          <h1 className="text-3xl font-bold mb-4">
            {vehicle.brand} {vehicle.model}
          </h1>
          
          <div className="text-4xl font-bold text-orange-500 mb-6">
            €{vehicle.price.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Year</p>
              <p className="font-semibold">{vehicle.year}</p>
            </div>
            <div>
              <p className="text-gray-600">Mileage</p>
              <p className="font-semibold">{vehicle.mileage?.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-gray-600">Fuel Type</p>
              <p className="font-semibold">{vehicle.fuelType}</p>
            </div>
            <div>
              <p className="text-gray-600">Transmission</p>
              <p className="font-semibold">{vehicle.transmission}</p>
            </div>
            {vehicle.color && (
              <div>
                <p className="text-gray-600">Color</p>
                <p className="font-semibold">{vehicle.color}</p>
              </div>
            )}
            {vehicle.engine && (
              <div>
                <p className="text-gray-600">Engine</p>
                <p className="font-semibold">{vehicle.engine}</p>
              </div>
            )}
          </div>

          {vehicle.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{vehicle.description}</p>
            </div>
          )}

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Features</h2>
              <ul className="grid grid-cols-2 gap-2">
                {vehicle.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-orange-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Interested in this vehicle?</h2>
            <ContactForm vehicleInfo={`${vehicle.brand} ${vehicle.model} - €${vehicle.price.toLocaleString()}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for better performance
export async function generateStaticParams() {
  const vehicles = await client.fetch<Vehicle[]>(
    `*[_type == "vehicle"]{ slug }`
  );

  return vehicles
    .filter(vehicle => vehicle.slug?.current)
    .map((vehicle) => ({
      slug: vehicle.slug.current,
    }));
}

// Enable ISR
export const revalidate = 60;
