'use client';

import { Menu, X, Phone, Car, Globe } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/translations';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.vehicles'), href: '/vehicles' },
    { name: t('nav.services'), href: '/services' },
    { name: 'Financimi', href: '/financing' },
    { name: 'Flotë', href: '/fleet-sales' },
    { name: t('trade.title'), href: '/trade-in' },
    { name: t('nav.contact'), href: '/contact' }
  ];

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
    { code: 'sr', name: 'Српски', flag: '🇷🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[var(--primary-orange)] rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">AUTO ANI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-[var(--primary-orange)] font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Phone Number and Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:+38349204242"
              className="flex items-center space-x-2 text-[var(--primary-orange)] hover:text-orange-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">+383 49 204 242</span>
            </a>

            {/* Language Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === language)?.flag}</span>
              </Button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                        language === lang.code ? 'bg-gray-50 font-semibold' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-[var(--primary-orange)] font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 py-2 border-t border-gray-200">
                <a
                  href="tel:+38349204242"
                  className="flex items-center space-x-2 text-[var(--primary-orange)] hover:text-orange-600 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">+383 49 204 242</span>
                </a>
              </div>

              {/* Mobile Language Switcher */}
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-2">{t('nav.language')}</div>
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md flex items-center space-x-2 ${
                        language === lang.code ? 'bg-gray-100 font-semibold' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}