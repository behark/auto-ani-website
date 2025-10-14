import { notFound } from "next/navigation";
import Image from "next/image";
import { client, urlFor } from "@/lib/sanity";
import { Vehicle } from "@/lib/sanity";

interface PageProps {
  params: { slug: string };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  // Fetch vehicle by slug
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

  const whatsappMessage = `Hi, I'm interested in ${vehicle.brand} ${vehicle.model} - €${vehicle.price.toLocaleString()}`;
  const whatsappUrl = `https://wa.me/38349204242?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicle Images */}
        <div>
          <div className="relative h-96 mb-4 rounded-lg overflow-hidden bg-gray-100">
            {vehicle.mainImage ? (
              <Image
                src={urlFor(vehicle.mainImage).url()}
                alt={vehicle.title || `${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image Available
              </div>
            )}
          </div>
          
          {/* Gallery */}
          {vehicle.gallery && vehicle.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {vehicle.gallery.map((image, index) => (
                <div key={index} className="relative h-24 rounded overflow-hidden bg-gray-100">
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
            €{vehicle.price?.toLocaleString() || '0'}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {vehicle.year && (
              <div>
                <p className="text-gray-600">Year</p>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
            )}
            {vehicle.mileage && (
              <div>
                <p className="text-gray-600">Mileage</p>
                <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
              </div>
            )}
            {vehicle.fuelType && (
              <div>
                <p className="text-gray-600">Fuel Type</p>
                <p className="font-semibold">{vehicle.fuelType}</p>
              </div>
            )}
            {vehicle.transmission && (
              <div>
                <p className="text-gray-600">Transmission</p>
                <p className="font-semibold">{vehicle.transmission}</p>
              </div>
            )}
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
                  <li key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Section */}
          <div className="bg-orange-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Interested in this vehicle?</h2>
            <div className="space-y-3">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 text-white text-center px-6 py-3 rounded-lg hover:bg-green-600 transition"
              >
                WhatsApp Us
              </a>
              <a 
                href="tel:+38349204242"
                className="block w-full bg-orange-500 text-white text-center px-6 py-3 rounded-lg hover:bg-orange-600 transition"
              >
                Call: +383 49 204 242
              </a>
              <a 
                href="mailto:aniautosallon@gmail.com"
                className="block w-full bg-gray-700 text-white text-center px-6 py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const vehicles = await client.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "vehicle" && defined(slug.current)]{ slug }`
    );

    return vehicles.map((vehicle) => ({
      slug: vehicle.slug.current,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Enable ISR
export const revalidate = 60;
