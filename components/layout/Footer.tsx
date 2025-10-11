'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Clock, Award, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COMPANY_INFO, NAVIGATION_LINKS } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[var(--secondary-navy)] text-white">
      {/* Newsletter Section */}
      <div className="bg-[var(--primary-orange)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">{t('newsletter.title')}</h3>
              <p className="text-white/90">{t('newsletter.subtitle')}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder={t('newsletter.placeholder')}
                className="bg-white text-gray-900 min-w-[250px]"
              />
              <Button variant="secondary" className="bg-[var(--secondary-navy)] hover:bg-[var(--secondary-light)]">
                {t('newsletter.button')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-3xl font-bold mb-4">
              <span className="text-[var(--primary-orange)]">AUTO</span> ANI
            </h3>
            <p className="text-gray-200 mb-4 font-medium">{COMPANY_INFO.tagline}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-2xl font-bold text-[var(--primary-orange)]">{COMPANY_INFO.stats.yearsInBusiness}+</p>
                <p className="text-xs text-gray-300 font-semibold">{t('footer.years')}</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-2xl font-bold text-[var(--primary-orange)]">{COMPANY_INFO.stats.vehiclesSold}+</p>
                <p className="text-xs text-gray-300 font-semibold">{t('footer.vehiclesSold')}</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded">
                <p className="text-2xl font-bold text-[var(--primary-orange)]">{COMPANY_INFO.stats.googleRating}</p>
                <p className="text-xs text-gray-300 font-semibold">{t('stats.rating')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={COMPANY_INFO.social.facebook}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={COMPANY_INFO.social.instagram}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={COMPANY_INFO.social.twitter}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={COMPANY_INFO.social.linkedin}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--primary-orange)] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-200 hover:text-[var(--primary-orange)] transition-colors font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">{t('services.title')}</h4>
            <ul className="space-y-2 text-gray-200">
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('services.sales')}</li>
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('promotions.financing')}</li>
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('promotions.tradeInBonus')}</li>
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('services.import')}</li>
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('services.insurance')}</li>
              <li className="hover:text-[var(--primary-orange)] transition-colors cursor-pointer font-medium">{t('services.afterSales')}</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--primary-orange)]">{t('contact.title')}</h4>
            <div className="space-y-3 text-gray-200">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1 text-[var(--primary-orange)]" />
                <p className="font-medium">{COMPANY_INFO.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[var(--primary-orange)]" />
                <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-[var(--primary-orange)] font-medium">
                  {COMPANY_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--primary-orange)]" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-[var(--primary-orange)] font-medium">
                  {COMPANY_INFO.email}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-1 text-[var(--primary-orange)]" />
                <div className="font-medium">
                  <p>{t('contact.weekdays')}: {COMPANY_INFO.hours.weekdays}</p>
                  <p>{t('contact.saturday')}: {COMPANY_INFO.hours.saturday}</p>
                  <p>{t('contact.sunday')}: {COMPANY_INFO.hours.sunday}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-300">
            <p className="font-medium">&copy; 2015-2024 {COMPANY_INFO.name}. {t('footer.allRights')} | 2015 | {COMPANY_INFO.stats.satisfiedCustomers}+ {t('footer.satisfiedCustomers')}</p>
            <div className="flex gap-4 font-medium">
              <Link href="/privacy" className="hover:text-[var(--primary-orange)]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[var(--primary-orange)]">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}