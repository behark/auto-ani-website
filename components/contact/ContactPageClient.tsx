'use client';

import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_INFO } from '@/lib/constants';

export default function ContactPageClient() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('contact.getInTouchDesc')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.getInTouch')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[var(--primary-orange)] mt-1" />
                  <div>
                    <p className="font-semibold">{t('contact.address')}</p>
                    <p className="text-gray-600">{COMPANY_INFO.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[var(--primary-orange)] mt-1" />
                  <div>
                    <p className="font-semibold">{t('contact.phone')}</p>
                    <a href={`tel:${COMPANY_INFO.phone}`} className="text-gray-600 hover:text-[var(--primary-orange)]">
                      {COMPANY_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[var(--primary-orange)] mt-1" />
                  <div>
                    <p className="font-semibold">{t('contact.email')}</p>
                    <a href={`mailto:${COMPANY_INFO.email}`} className="text-gray-600 hover:text-[var(--primary-orange)]">
                      {COMPANY_INFO.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[var(--primary-orange)] mt-1" />
                  <div>
                    <p className="font-semibold">{t('contact.hours')}</p>
                    <p className="text-gray-600">{t('contact.weekdays')}: {COMPANY_INFO.hours.weekdays}</p>
                    <p className="text-gray-600">{t('contact.saturday')}: {COMPANY_INFO.hours.saturday}</p>
                    <p className="text-gray-600">{t('contact.sunday')}: {COMPANY_INFO.hours.sunday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.followUs')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <a
                    href={COMPANY_INFO.social.facebook}
                    className="w-10 h-10 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href={COMPANY_INFO.social.instagram}
                    className="w-10 h-10 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href={COMPANY_INFO.social.twitter}
                    className="w-10 h-10 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href={COMPANY_INFO.social.linkedin}
                    className="w-10 h-10 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>{t('contact.responseTime')}:</strong> {t('contact.usuallyWithinHour')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>{COMPANY_INFO.stats.googleReviews}</strong> {t('testimonials.googleReviews')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>{COMPANY_INFO.stats.googleRating}/5</strong> {t('contact.averageRating')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('contact.contactForm')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('contact.formComingSoon')}</p>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {t('contact.immediateHelp')}
                  </p>
                  <div className="space-y-2">
                    <a
                      href={`tel:${COMPANY_INFO.phone}`}
                      className="block text-lg font-semibold text-[var(--primary-orange)] hover:underline"
                    >
                      {COMPANY_INFO.phone}
                    </a>
                    <a
                      href={`https://wa.me/${COMPANY_INFO.phone.replace(/[^0-9]/g, '')}`}
                      className="block text-green-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('contact.whatsappMessage')}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('contact.findUs')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 bg-gray-200 relative rounded-b-lg overflow-hidden">
              <a
                href="https://www.google.com/maps?q=42.871313,20.860395"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors group"
              >
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-[var(--primary-orange)] mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">AUTO ANI - Mitrovica</p>
                  <p className="text-gray-600 mb-4">Click to open in Google Maps</p>
                  <div className="inline-flex items-center gap-2 text-[var(--primary-orange)] group-hover:underline">
                    <span>View on Google Maps</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}