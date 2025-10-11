import { Metadata } from 'next';
import { Calendar, User, Eye, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Blog dhe Lajme | AUTO ANI - Këshilla dhe Informacione",
  description: "Lexoni këshilla për blerjen e veturave, lajme nga industria e automjeteve dhe udhëzime për mirëmbajtjen. Blog i AUTO ANI me përmbajtje të dobishme.",
  keywords: "blog AUTO ANI, këshilla vetura, lajme automotive, mirëmbajtje veturash, blerje veturash",
  openGraph: {
    title: "Blog AUTO ANI | Këshilla dhe Lajme Automotive",
    description: "Përmbajtje e specializuar për të gjithë dashamirët e automjeteve.",
    url: "https://auto-ani-website.onrender.com/blog",
  },
};

// This will be replaced with database fetch
async function getBlogPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';
    const response = await fetch(`${baseUrl}/api/blog?published=true&limit=12`, {
      next: { revalidate: 300 } // 5 minutes cache
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  // Sample blog posts for initial display
  const samplePosts = [
    {
      id: '1',
      title: '10 Gjëra që Duhet të Dini Para se të Blini Veturë të Përdorur',
      slug: '10-gjera-qe-duhet-te-dini-para-se-te-blini-veture-te-perdorur',
      excerpt: 'Udhëzues i detajuar për blerjen e sigurt të një veture të përdorur. Mësoni se çfarë të kontrolloni dhe si të shmangni gabimet e zakonshme.',
      featuredImage: '/images/blog/buying-guide.jpg',
      author: 'AUTO ANI Team',
      category: 'Këshilla Blerje',
      tags: ['Blerje', 'Vetura të Përdorura', 'Këshilla'],
      views: 1250,
      publishedAt: '2024-10-01',
      estimatedReadTime: 8
    },
    {
      id: '2',
      title: 'Si të Ruani Vlerën e Veturës Tuaj: Këshilla Mirëmbajtje',
      slug: 'si-te-ruani-vleren-e-vetures-tuaj-keshilla-mirembajtje',
      excerpt: 'Mirëmbajtja e rregullt është çelësi për të ruajtur vlerën e veturës. Zbuloni sekretet e ekspertëve për kujdesin optimal.',
      featuredImage: '/images/blog/maintenance-tips.jpg',
      author: 'Mentor Gashi',
      category: 'Mirëmbajtje',
      tags: ['Mirëmbajtje', 'Këshilla', 'DIY'],
      views: 890,
      publishedAt: '2024-09-28',
      estimatedReadTime: 6
    },
    {
      id: '3',
      title: 'Trendi i Veturave Elektrike në Kosovë 2024',
      slug: 'trendi-i-veturave-elektrike-ne-kosove-2024',
      excerpt: 'Analiza e tregut të veturave elektrike në Kosovë. Çka po ndryshon dhe çfarë mund të presim në të ardhmen.',
      featuredImage: '/images/blog/electric-cars.jpg',
      author: 'Ardit Berisha',
      category: 'Trend & Analiza',
      tags: ['Elektrike', 'Trend', 'Kosovë', 'Analiza'],
      views: 2100,
      publishedAt: '2024-09-25',
      estimatedReadTime: 10
    },
    {
      id: '4',
      title: 'Financimi i Veturave: Opsionet më të Mira për 2024',
      slug: 'financimi-i-veturave-opsionet-me-te-mira-per-2024',
      excerpt: 'Krahasimi i bankave dhe kompanive të financimit në Kosovë. Gjeni opsionin më të përshtatshëm për buxhetin tuaj.',
      featuredImage: '/images/blog/car-financing.jpg',
      author: 'Fitore Krasniqi',
      category: 'Financim',
      tags: ['Financim', 'Kredite', 'Banka', 'Këshilla'],
      views: 1680,
      publishedAt: '2024-09-20',
      estimatedReadTime: 12
    },
    {
      id: '5',
      title: 'BMW vs Mercedes vs Audi: Krahasimi i Markave Premium',
      slug: 'bmw-vs-mercedes-vs-audi-krahasimi-i-markave-premium',
      excerpt: 'Analiza e detajuar e tre markave më të popullarizuara premium në tregun e Kosovës. Cilën të zgjidhni?',
      featuredImage: '/images/blog/premium-comparison.jpg',
      author: 'AUTO ANI Team',
      category: 'Krahasime',
      tags: ['BMW', 'Mercedes', 'Audi', 'Premium', 'Krahasim'],
      views: 3200,
      publishedAt: '2024-09-15',
      estimatedReadTime: 15
    },
    {
      id: '6',
      title: 'Kontrolli Teknik i Veturës: Çka Duhet të Dini',
      slug: 'kontrolli-teknik-i-vetures-cka-duhet-te-dini',
      excerpt: 'Udhëzues i plotë për kontrollin teknik. Si t\'i përgatitni veturën dhe çka të presni nga procesi.',
      featuredImage: '/images/blog/technical-inspection.jpg',
      author: 'Besnik Haliti',
      category: 'Ligjore',
      tags: ['Kontroll Teknik', 'Ligjore', 'Regjistrim', 'Sigurim'],
      views: 1450,
      publishedAt: '2024-09-10',
      estimatedReadTime: 7
    }
  ];

  const displayPosts = posts.length > 0 ? posts : samplePosts;
  const categories = [...new Set(displayPosts.map((post: any) => post.category))];
  const popularPosts = displayPosts.filter((post: any) => post.views > 1500);
  const recentPosts = displayPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog AUTO ANI
            </h1>
            <p className="text-xl text-orange-100">
              Këshilla ekspertë, lajme dhe udhëzime për botën e automjeteve
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {displayPosts.length > 0 && (
              <Card className="mb-8 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={displayPosts[0].featuredImage}
                      alt={displayPosts[0].title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <Badge className="absolute top-4 left-4 bg-orange-500">
                      I Zgjedhur
                    </Badge>
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center">
                    <Badge variant="outline" className="w-fit mb-3">
                      {displayPosts[0].category}
                    </Badge>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {displayPosts[0].title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {displayPosts[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {displayPosts[0].author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(displayPosts[0].publishedAt).toLocaleDateString('sq')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {displayPosts[0].views.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Link href={`/blog/${displayPosts[0].slug}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        Lexo Më Shumë
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPosts.slice(1).map((post: any) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <Badge className="absolute top-3 left-3" variant="secondary">
                      {post.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={12} />
                          {post.views.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(post.publishedAt).toLocaleDateString('sq')}
                      </div>
                    </div>

                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Lexo Artikullin
                        <ArrowRight className="ml-2" size={14} />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="font-bold text-gray-900">Kategoritë</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {(categories as string[]).map((category: string) => {
                  const count = displayPosts.filter((post: any) => post.category === category).length;
                  return (
                    <Link
                      key={category}
                      href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex justify-between items-center py-2 hover:text-orange-600 transition-colors"
                    >
                      <span>{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Popular Posts */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="font-bold text-gray-900">Më të Lexuarit</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularPosts.slice(0, 4).map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                    <div className="flex gap-3 hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors">
                      <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Eye size={12} />
                          {post.views.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Newsletter AUTO ANI</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Merrni lajme dhe këshilla direkt në email
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email adresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <Button className="w-full bg-orange-500 hover:bg-orange-600" size="sm">
                    Abonohu
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  1-2 email në javë, anuloni kur të dëshironi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Keni pyetje rreth blerjes së veturës?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Ekspertët tanë janë të gatshëm t'ju ndihmojnë. Rezervoni një konsultim falas
            ose shikoni koleksionin tonë të veturave premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                Kontakto Ekspertët
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button variant="outline" size="lg">
                Shiko Veturat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}