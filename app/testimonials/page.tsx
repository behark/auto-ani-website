import { Metadata } from 'next';
import { Star, Quote, Calendar, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Çka Thonë Klientët | AUTO ANI - Dëshmi dhe Vlerësime",
  description: "Lexoni dëshmitë e klientëve të AUTO ANI. Mbi 2500 klientë të kënaqur që nga viti 2015. Vlerësime të sinqerta dhe eksperienca pozitive të blerjes së veturave.",
  keywords: "dëshmi klientësh, vlerësime AUTO ANI, eksperienca blerjes, klientë të kënaqur, testimoniale",
  openGraph: {
    title: "Dëshmi Klientësh | AUTO ANI",
    description: "Mbi 2500 klientë të kënaqur. Lexoni eksperiencat e tyre me AUTO ANI.",
    url: "https://auto-ani-website.onrender.com/testimonials",
  },
};

// This will be replaced with database fetch once we deploy
async function getTestimonials() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';
    const response = await fetch(`${baseUrl}/api/testimonials?approved=true`, {
      next: { revalidate: 300 } // 5 minutes cache
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.testimonials || [];
  } catch (error) {
    // Error is expected when API is not available during build time
    return [];
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        {rating}.0/5
      </span>
    </div>
  );
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  // Sample testimonials for initial display
  const sampleTestimonials = [
    {
      id: '1',
      customerName: 'Ardit Kasemi',
      rating: 5,
      title: 'Shërbim i shkëlqyer dhe profesional',
      content: 'Bleva një BMW X3 nga AUTO ANI dhe eksperienca ishte fantastike. Stafi ishte shumë profesional dhe më ndihmoi në çdo hap. Vetura ishte pikërisht siç e përshkruan dhe çmimi shumë i arsyeshëm.',
      location: 'Prishtinë',
      purchaseDate: '2024-09-15',
      vehicleMake: 'BMW',
      vehicleModel: 'X3',
      vehicleYear: 2019,
      photos: ['/images/testimonials/ardit-bmw.jpg']
    },
    {
      id: '2',
      customerName: 'Fitore Berisha',
      rating: 5,
      title: 'Financimi më i mirë në Kosovë',
      content: 'U mahnitëm me kushtet e financimit që na ofruan. 0% kamatë dhe kushte të favorshme. Tani drejtojmë një Mercedes C-Class të shkëlqyer. Faleminderit AUTO ANI!',
      location: 'Mitrovicë',
      purchaseDate: '2024-08-22',
      vehicleMake: 'Mercedes',
      vehicleModel: 'C-Class',
      vehicleYear: 2020,
      photos: []
    },
    {
      id: '3',
      customerName: 'Mentor Gashi',
      rating: 5,
      title: 'Cilësi dhe besueshmëri',
      content: 'Kjo është hera e tretë që blej veturë nga AUTO ANI. Cilësia e veturave dhe shërbimi passhitjes janë të shkëlqyera. Rekomandoj pa dyshim.',
      location: 'Pejë',
      purchaseDate: '2024-07-10',
      vehicleMake: 'Audi',
      vehicleModel: 'A4',
      vehicleYear: 2021,
      photos: ['/images/testimonials/mentor-audi.jpg']
    },
    {
      id: '4',
      customerName: 'Blerta Musliu',
      rating: 4,
      title: 'Eksperiencë e shkëlqyer familjare',
      content: 'Si familje me fëmijë të vegjël, kishim nevojë për një veturë të sigurtë dhe të besueshme. AUTO ANI na ndihmoi të gjejmë Volkswagen Tiguan-in perfekt. Tani udhëtojmë me siguri!',
      location: 'Gjilan',
      purchaseDate: '2024-06-05',
      vehicleMake: 'Volkswagen',
      vehicleModel: 'Tiguan',
      vehicleYear: 2019,
      photos: []
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : sampleTestimonials;

  // Calculate statistics
  const totalReviews = displayTestimonials.length;
  const averageRating = displayTestimonials.reduce((sum: number, t: any) => sum + t.rating, 0) / totalReviews;
  const fiveStarCount = displayTestimonials.filter((t: any) => t.rating === 5).length;
  const fourStarCount = displayTestimonials.filter((t: any) => t.rating === 4).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Çka Thonë Klientët Tanë
            </h1>
            <p className="text-xl text-orange-100 mb-8">
              Mbi 2,500 klientë të kënaqur që nga viti 2015
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(averageRating)} />
                <div className="text-sm text-orange-100 mt-1">Vlerësimi Mesatar</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">{totalReviews}</div>
                <div className="text-sm text-orange-100">Dëshmi Klientësh</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">{Math.round((fiveStarCount / totalReviews) * 100)}%</div>
                <div className="text-sm text-orange-100">5 Yje</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Rating Breakdown */}
        <div className="mb-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Shpërndarja e Vlerësimeve</h2>

            {[5, 4, 3, 2, 1].map((stars: number) => {
              const count = displayTestimonials.filter((t: any) => t.rating === stars).length;
              const percentage = (count / totalReviews) * 100;

              return (
                <div key={stars} className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {displayTestimonials.map((testimonial: any, index: number) => (
            <Card key={testimonial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {testimonial.customerName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin size={14} />
                      {testimonial.location}
                      <Calendar size={14} className="ml-2" />
                      {new Date(testimonial.purchaseDate).toLocaleDateString('sq')}
                    </div>
                  </div>
                  <StarRating rating={testimonial.rating} />
                </div>

                {testimonial.title && (
                  <h4 className="font-medium text-gray-900 mb-3">{testimonial.title}</h4>
                )}

                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 text-orange-200" size={24} />
                  <p className="text-gray-700 leading-relaxed pl-6 mb-4">
                    {testimonial.content}
                  </p>
                </div>

                {(testimonial.vehicleMake || testimonial.vehicleModel) && (
                  <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                    <Car size={16} className="text-orange-500" />
                    <span className="font-medium">
                      {testimonial.vehicleMake} {testimonial.vehicleModel} {testimonial.vehicleYear}
                    </span>
                  </div>
                )}

                {testimonial.photos && testimonial.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {testimonial.photos.slice(0, 2).map((photo: string, photoIndex: number) => (
                      <div key={photoIndex} className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={photo}
                          alt={`${testimonial.customerName} testimonial photo`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            A keni blerë veturë nga AUTO ANI?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Ndani eksperiencën tuaj me ne dhe ndihmoni klientë të tjerë të marrin vendimin e duhur.
            Dëshmia juaj është e vlefshme për ne!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/testimonials/submit">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                Shkruaj Dëshminë Tënde
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button variant="outline" size="lg">
                Shiko Veturat Tona
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">9+</div>
            <div className="text-sm text-gray-600">Vite Eksperiencë</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">2500+</div>
            <div className="text-sm text-gray-600">Klientë të Kënaqur</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">{Math.round(averageRating * 10)/10}</div>
            <div className="text-sm text-gray-600">Vlerësimi Mesatar</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">{Math.round((fiveStarCount / totalReviews) * 100)}%</div>
            <div className="text-sm text-gray-600">Vlerësime 5 Yje</div>
          </div>
        </div>
      </div>
    </div>
  );
}