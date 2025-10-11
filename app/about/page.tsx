'use client';

import Link from 'next/link';
import Image from 'next/image';

import { Award, Users, TrendingUp, Shield } from 'lucide-react';

import FallbackImage from '@/components/ui/FallbackImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { imageLoader } from '@/lib/imageLoader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  const milestones = [
    { year: '2015', title: t('about.companyFounded'), description: t('about.companyFoundedDesc') },
    { year: '2018', title: t('about.expandedOperations'), description: t('about.expandedOperationsDesc') },
    { year: '2020', title: `2000+ ${t('about.carsSold')}`, description: t('about.carsSoldDesc') },
    { year: '2022', title: t('about.digitalTransformation'), description: t('about.digitalTransformationDesc') },
    { year: '2024', title: t('about.industryLeader'), description: t('about.industryLeaderDesc') }
  ];

  const teamMembers = [
    { name: 'Behar Gashi', position: t('about.ceoFounder'), image: '/images/team/behar-gashi.jpg' },
    { name: 'Arben Hasani', position: t('about.salesDirector'), image: '/images/team/arben-hasani.jpg' },
    { name: 'Fitim Berisha', position: t('about.serviceManager'), image: '/images/team/fitim-berisha.jpg' },
    { name: 'Valdete Krasniqi', position: t('about.financeManager'), image: '/images/team/valdete-krasniqi.jpg' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[400px] bg-gradient-to-r from-[var(--secondary-navy)] to-[var(--secondary-light)]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">
              {t('about.title')} <span className="text-[var(--primary-orange)]">AUTO ANI</span>
            </h1>
            <p className="text-xl">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                {t('about.ourStory')}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>{t('about.storyP1')}</p>
                <p>{t('about.storyP2')}</p>
                <p>{t('about.storyP3')}</p>
                <p>{t('about.storyP4')}</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--primary-orange)]">2,500+</div>
                    <div className="text-gray-600">{t('about.happyCustomers')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--primary-orange)]">9+</div>
                    <div className="text-gray-600">{t('about.yearsOfService')}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/images/auto-ani-showroom.jpg"
                  alt="AUTO ANI Showroom"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loader={process.env.NODE_ENV === 'production' ? imageLoader : undefined}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[var(--primary-orange)] text-white p-6 rounded-lg shadow-xl">
                <Award className="h-12 w-12 mb-2" />
                <div className="font-bold">{t('about.awardWinning')}</div>
                <div className="text-sm">{t('about.dealership2023')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('about.mission')} & <span className="text-[var(--primary-orange)]">{t('about.values')}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-[var(--primary-orange)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.customerFocus')}</h3>
                <p className="text-gray-600">
                  {t('about.customerFocusDesc')}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-[var(--primary-orange)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.integrity')}</h3>
                <p className="text-gray-600">
                  {t('about.integrityDesc')}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-[var(--primary-orange)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('about.excellence')}</h3>
                <p className="text-gray-600">
                  {t('about.excellenceDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('about.ourJourney')}
          </h2>
          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[var(--primary-orange)] rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-20 bg-gray-300 mx-auto mt-2" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">{milestone.title}</h3>
                      <span className="text-[var(--primary-orange)] font-bold">{milestone.year}</span>
                    </div>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('about.meetOurTeam')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-square bg-gray-200 relative">
                  <FallbackImage
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    fallbackSrc="/images/placeholder-vehicle.svg"
                  />
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-[var(--primary-orange)]">{member.position}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-primary rounded-lg p-8 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">{t('whyChooseUs.readyToFind')}</h3>
            <p className="mb-6 text-white/90 max-w-2xl mx-auto">
              {t('whyChooseUs.contactPersonalized')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/vehicles">
                <Button size="lg" variant="secondary" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                  {t('cta.viewInventory')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--primary-orange)]">
                  {t('cta.contactUs')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}