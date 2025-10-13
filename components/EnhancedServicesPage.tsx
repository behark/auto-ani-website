'use client';

import { Car, Calculator, Wrench, Shield, CheckCircle, Clock, Users, Award, RefreshCw, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { client, queries, Service } from '@/lib/sanity';

const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  car: Car,
  calculator: Calculator,
  wrench: Wrench,
  shield: Shield,
  'refresh-cw': RefreshCw,
  truck: Truck
};

export default function EnhancedServicesPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback services data that matches existing structure
  const fallbackServicesData = [
    {
      id: '1',
      title: t('services.sales'),
      description: t('services.salesDesc'),
      icon: 'car',
      features: [
        t('services.qualityCertified'),
        t('services.competitivePricing'),
        t('services.fullServiceHistory'),
        t('services.extendedWarranty')
      ]
    },
    {
      id: '2',
      title: t('services.financing'),
      description: t('services.financingDesc'),
      icon: 'calculator',
      features: [
        t('promotions.financing'),
        t('services.quickApproval'),
        t('services.flexibleTerms'),
        t('services.bestRates')
      ]
    },
    {
      id: '3',
      title: t('services.tradeIn'),
      description: t('services.tradeInDesc'),
      icon: 'refresh-cw',
      features: [
        t('services.fairValuation'),
        t('promotions.tradeInBonus'),
        t('services.instantEval'),
        t('services.quickProcessing')
      ]
    },
    {
      id: '4',
      title: t('services.import'),
      description: t('services.importDesc'),
      icon: 'truck',
      features: [
        t('services.euSourcing'),
        t('services.docHandling'),
        t('services.transportArranged'),
        t('services.bestRates')
      ]
    },
    {
      id: '5',
      title: t('services.insurance'),
      description: t('services.insuranceDesc'),
      icon: 'shield',
      features: [
        t('services.insurancePartners'),
        t('services.registrationHelp'),
        t('services.bestRates'),
        t('services.quickApproval')
      ]
    },
    {
      id: '6',
      title: t('services.afterSales'),
      description: t('services.afterSalesDesc'),
      icon: 'wrench',
      features: [
        t('services.extendedWarranty'),
        t('services.maintenancePack'),
        t('services.genuineParts'),
        t('services.qualityCertified')
      ]
    }
  ];

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const sanityServices = await client.fetch(queries.services);

        if (sanityServices && sanityServices.length > 0) {
          // Transform Sanity services to match component structure
          const transformedServices = sanityServices
            .filter((service: Service) => service.businessTypes.includes('dealership') || service.businessTypes.includes('all'))
            .map((service: any) => ({
              _id: service._id,
              name: service.name,
              description: service.description,
              price: service.price,
              duration: service.duration,
              features: service.features || [],
              category: service.category,
              image: service.image,
              businessTypes: service.businessTypes,
              bookingRequired: service.bookingRequired
            }));

          setServices(transformedServices);
        } else {
          // Fallback to static data structure
          console.log('No Sanity services found, using fallback data');
          setServices(fallbackServicesData.map((service, index) => ({
            _id: `fallback-${index}`,
            name: service.title,
            description: service.description,
            price: 0,
            duration: undefined,
            features: service.features,
            category: service.icon,
            businessTypes: ['dealership'],
            bookingRequired: false
          })));
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
        // Use fallback data
        setServices(fallbackServicesData.map((service, index) => ({
          _id: `fallback-${index}`,
          name: service.title,
          description: service.description,
          price: 0,
          duration: undefined,
          features: service.features,
          category: service.icon,
          businessTypes: ['dealership'],
          bookingRequired: false
        })));
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [t]);

  // Get icon for service based on category
  const getServiceIcon = (category: string) => {
    const iconName = category?.toLowerCase();
    return iconMap[iconName] || iconMap['car'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-orange)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  // Use fallback data if no services or error
  const displayServices = services.length > 0 ? services : fallbackServicesData.map((service, index) => ({
    _id: `fallback-${index}`,
    name: service.title,
    description: service.description,
    price: 0,
    duration: undefined,
    features: service.features,
    category: service.icon,
    businessTypes: ['dealership'],
    bookingRequired: false
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('services.title')}
          </h1>
          <p className="text-gray-700 max-w-2xl mx-auto font-medium">
            {t('services.subtitle')}
          </p>
          {error && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-600 px-4 py-2 rounded-lg text-sm max-w-md mx-auto">
              ⚠️ Using backup service information
            </div>
          )}
          {services.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {services.length} services available
            </p>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {displayServices.map((service, index) => {
            const Icon = getServiceIcon(service.category);
            const fallbackService = fallbackServicesData[index];

            return (
              <Card key={service._id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[var(--primary-orange)] to-[var(--accent-yellow)] text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{service.name}</CardTitle>
                      {service.price > 0 && (
                        <p className="text-white/80 text-sm">From €{service.price}</p>
                      )}
                      {service.duration && (
                        <p className="text-white/80 text-sm">{service.duration} minutes</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-6 font-medium">{service.description}</p>
                  <div className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-800 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/contact">
                    <Button className="mt-6 w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
                      {service.bookingRequired ? 'Book Service' : t('cta.learnMore')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Our Services */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('whyChooseUs.title')} <span className="text-[var(--primary-orange)]">{t('services.title')}</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('services.qualityCertified')}</h3>
              <p className="text-sm text-gray-700 font-medium">Our team consists of certified professionals with years of experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('whyChooseUs.quickProcessing')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('whyChooseUs.quickProcessingDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('services.extendedWarranty')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('services.afterSalesDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[var(--primary-orange)]" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{t('footer.satisfiedCustomers')}</h3>
              <p className="text-sm text-gray-700 font-medium">{t('whyChooseUs.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-[var(--primary-orange)] to-[var(--accent-yellow)] rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">{t('whyChooseUs.readyToFind')}</h3>
          <p className="mb-6 text-white/90">
            {t('whyChooseUs.contactPersonalized')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                {t('cta.contactUs')}
              </Button>
            </Link>
            <Link href="/vehicles">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[var(--primary-orange)]">
                {t('cta.viewInventory')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}