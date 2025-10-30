import { Star, ThumbsUp, Quote, CheckCircle, User, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

import StructuredData from '@/components/seo/StructuredData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { generatePageSchemas } from '@/lib/seo-schema';

// Enable ISR with 6-hour revalidation for customer reviews
// Reviews are added periodically but not frequently enough to need shorter caching
export const revalidate = 21600; // 6 hours

export const metadata: Metadata = {
  title: "Vlerësimet e Klientëve | AUTO ANI - 2500+ Klientë të Kënaqur",
  description: "Lexoni përvojat e klientëve tanë në AUTO ANI. Mbi 2500 klientë të kënaqur që nga viti 2015. Vlerësim mesatar 4.8/5 yje.",
  keywords: "vlerësime AUTO ANI, recensione klientësh, përvoja klientësh, dëshmi AUTO ANI, auto salon reviews",
  openGraph: {
    title: "Çfarë Thonë Klientët | AUTO ANI",
    description: "2500+ klientë të kënaqur. Vlerësim 4.8/5 yje. Lexoni përvojat reale.",
    type: "website",
    url: "https://autosalonani.com/reviews",
  },
};

// Mock reviews data - in production this would come from an API or database
const reviews = [
  {
    id: 1,
    name: "Driton Berisha",
    date: "2024-10-15",
    rating: 5,
    vehicle: "BMW 320d 2021",
    verified: true,
    helpful: 45,
    review: "Përvoja më e mirë e blerjes së veturës! Stafi jashtëzakonisht profesional, veçanërisht Besniku që na ndihmoi të gjejmë veturën perfekte. Financimi u rregullua brenda ditës, me kushte shumë të favorshme. E rekomandoj 100%!",
    pros: ["Shërbim profesional", "Çmime të arsyeshme", "Financim i shpejtë"],
  },
  {
    id: 2,
    name: "Adelina Krasniqi",
    date: "2024-09-28",
    rating: 5,
    vehicle: "Mercedes A-Class 2022",
    verified: true,
    helpful: 38,
    review: "Jam shumë e kënaqur me shërbimin dhe veturën. AUTO ANI është vendi ku do të kthehem për blerjen tjetër. Transparencë totale, pa surpriza të fshehura. Vetura ishte në gjendje perfekte siç u premtua.",
    pros: ["Transparencë", "Kualitet i garantuar", "Ekip i shkëlqyer"],
  },
  {
    id: 3,
    name: "Faton Gashi",
    date: "2024-09-10",
    rating: 4,
    vehicle: "Volkswagen Tiguan 2020",
    verified: true,
    helpful: 22,
    review: "Shërbim i mirë në përgjithësi. Procesi i shkëmbimit të veturës sime të vjetër ishte i lehtë. Çmimi i dhënë për veturën time ishte fer. E vetmja gjë që mund të përmirësohej është koha e pritjes për dokumentacion.",
    pros: ["Shkëmbim i drejtë", "Staf miqësor"],
    cons: ["Dokumentacioni nganjëherë ngadalë"],
  },
  {
    id: 4,
    name: "Blerta Morina",
    date: "2024-08-20",
    rating: 5,
    vehicle: "Audi Q3 2021",
    verified: true,
    helpful: 51,
    review: "Nuk mund të jem më e lumtur! Kam marrë Audi Q3 dhe është pikërisht ajo që kërkoja. Ekipi i AUTO ANI më ndihmoi me çdo detaj, nga test drive deri te sigurimi. Bonus shkëmbimi ishte fantastik!",
    pros: ["Test drive i gjatë", "Bonus shkëmbimi", "Ndihmë me sigurimin"],
  },
  {
    id: 5,
    name: "Mentor Hajdari",
    date: "2024-08-05",
    rating: 5,
    vehicle: "Toyota RAV4 2022",
    verified: true,
    helpful: 29,
    review: "Profesionalizëm në çdo aspekt! Kam blerë Toyota RAV4 dhe jam tepër i kënaqur. Vetura u dorëzua e pastruar profesionalisht, me të gjitha dokumentet gati. Garancia 2 vjeçare është bonus i madh.",
    pros: ["Garanci e gjatë", "Dorëzim perfekt", "Dokumentacion i plotë"],
  },
  {
    id: 6,
    name: "Vjosa Rexhepi",
    date: "2024-07-18",
    rating: 4,
    vehicle: "Mini Cooper 2021",
    verified: true,
    helpful: 17,
    review: "AUTO ANI ka koleksion të shkëlqyer veturash. Kam gjetur Mini Cooper që e doja me specifikat e sakta. Stafi ishte i durueshëm dhe i gatshëm të përgjigjej në të gjitha pyetjet.",
    pros: ["Koleksion i gjerë", "Staf i durueshëm", "Specifikat e sakta"],
  },
];

const ratingDistribution = [
  { stars: 5, count: 1850, percentage: 74 },
  { stars: 4, count: 450, percentage: 18 },
  { stars: 3, count: 125, percentage: 5 },
  { stars: 2, count: 50, percentage: 2 },
  { stars: 1, count: 25, percentage: 1 },
];

const testimonialVideos = [
  { id: 1, customer: "Arben Shala", title: "Përvoja ime me BMW X5" },
  { id: 2, customer: "Fitore Berisha", title: "Pse zgjodha AUTO ANI" },
  { id: 3, customer: "Luan Gashi", title: "Financimi 0% - Si funksionon" },
];

export default function ReviewsPage() {
  const schemas = generatePageSchemas('reviews');

  const totalReviews = 2500;
  const averageRating = 4.8;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <StructuredData schemas={schemas} />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Çfarë Thonë Klientët Tanë</h1>
            <p className="text-xl mb-8 opacity-90">
              Mbi 2500 klientë të kënaqur që nga viti 2015
            </p>

            {/* Overall Rating */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{averageRating}</div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(averageRating))}
                </div>
                <div className="text-sm opacity-75">Vlerësimi Mesatar</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{totalReviews}+</div>
                <div className="text-sm opacity-75">Vlerësime Totale</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">98%</div>
                <div className="text-sm opacity-75">E Rekomandojnë</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Rating Distribution */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Përmbledhje e Vlerësimeve</h2>
              <div className="space-y-3">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-20">
                      <span className="font-semibold">{item.stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress value={item.percentage} className="flex-1" />
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Reviews */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Vlerësimet e Fundit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{review.name}</h3>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verifikuar
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.date).toLocaleDateString('sq-AL')}
                            <span>•</span>
                            <span className="font-medium">{review.vehicle}</span>
                          </div>
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>

                    <div className="mb-4">
                      <Quote className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-gray-700">{review.review}</p>
                    </div>

                    {review.pros && (
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-green-600">Pozitive:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {review.pros.map((pro, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-green-200">
                              {pro}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {review.cons && (
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-orange-600">Për përmirësim:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {review.cons.map((con, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-orange-200">
                              {con}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        E dobishme ({review.helpful})
                      </Button>
                      <span className="text-sm text-gray-500">
                        {review.rating}/5 yje
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button variant="outline" size="lg">
                Shiko të Gjitha Vlerësimet
              </Button>
            </div>
          </div>

          {/* Video Testimonials */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Dëshmi Video</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonialVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden group cursor-pointer">
                  <div className="relative h-48 bg-gray-200">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-[var(--primary-orange)]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{video.title}</h3>
                    <p className="text-sm text-gray-600">{video.customer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Pse Na Zgjedhin Klientët</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">Garanci</div>
                  <div className="text-sm text-gray-600">2 vjet garanci</div>
                </div>
                <div className="text-center">
                  <Star className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <div className="font-semibold">Cilësi</div>
                  <div className="text-sm text-gray-600">Vetura të kontrolluara</div>
                </div>
                <div className="text-center">
                  <ThumbsUp className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <div className="font-semibold">Shërbim</div>
                  <div className="text-sm text-gray-600">Suport 24/7</div>
                </div>
                <div className="text-center">
                  <Quote className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                  <div className="font-semibold">Transparencë</div>
                  <div className="text-sm text-gray-600">Pa kosto të fshehura</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-[var(--primary-orange)] text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Bëhuni Pjesë e Familjes AUTO ANI</h2>
              <p className="text-xl mb-6 opacity-90">
                Bashkohuni me mijëra klientë të kënaqur
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                  Shiko Veturat
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  Kontaktoni
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}