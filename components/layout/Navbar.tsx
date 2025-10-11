'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Globe, MessageCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { COMPANY_INFO } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import FavoritesCounter from '@/components/favorites/FavoritesCounter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PWAStatusIndicator } from '@/components/pwa/PWAInstallPrompt';
import { MOTION_VARIANTS, ANIMATION_CLASSES } from '@/lib/animations';
import { imageLoader } from '@/lib/imageLoader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const navigationLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/vehicles', label: t('nav.vehicles') },
    { href: '/financing', label: 'Financing' },
    { href: '/services', label: t('nav.services') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
    { href: '/compare', label: t('nav.compare') },
    { href: '/alerts', label: 'Alerts', icon: Bell },
  ];

  const languages = [
    { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
    { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(l => l.code === language);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg py-3' : 'bg-white/95 backdrop-blur py-4'
      }`}
      initial={shouldReduceMotion ? {} : { y: -100 }}
      animate={shouldReduceMotion ? {} : { y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top Bar */}
      <div className="bg-[var(--secondary-navy)] text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <a href={`tel:${COMPANY_INFO.phone}`} className="flex items-center gap-2 hover:text-[var(--primary-orange)]">
              <Phone className="h-4 w-4" />
              <span>{COMPANY_INFO.phone}</span>
            </a>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">{COMPANY_INFO.email}</span>
            <span className="hidden lg:inline">|</span>
            <PWAStatusIndicator className="hidden lg:flex text-white" showText={true} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:text-[var(--primary-orange)] hover:bg-transparent">
                <Globe className="h-4 w-4 mr-2" />
                <span className="mr-1">{currentLang?.flag}</span>
                {currentLang?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as 'sq' | 'sr' | 'en')}
                  className={language === lang.code ? 'bg-gray-100' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="AUTO ANI"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
                loader={process.env.NODE_ENV === 'production' ? imageLoader : undefined}
              />
              <h1 className="text-3xl font-bold hidden">
                <span className="text-[var(--primary-orange)]">AUTO</span>
                <span className="text-[var(--secondary-navy)]"> ANI</span>
              </h1>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            className="hidden lg:flex items-center gap-8"
            variants={shouldReduceMotion ? {} : MOTION_VARIANTS.container}
            initial={shouldReduceMotion ? {} : "hidden"}
            animate={shouldReduceMotion ? {} : "visible"}
          >
            {navigationLinks.map((link, index) => (
              <motion.div
                key={link.href}
                variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                whileHover={shouldReduceMotion ? {} : {
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <Link
                  href={link.href}
                  className={`text-[var(--text-primary)] hover:text-[var(--primary-orange)] transition-colors font-medium relative group ${ANIMATION_CLASSES.linkHover} flex items-center gap-1`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                  {!shouldReduceMotion && (
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-orange)]"
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
            <motion.div
              variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
              whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
            >
              <FavoritesCounter variant="icon" />
            </motion.div>
            <motion.div
              variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
            >
              <ThemeToggle variant="icon" />
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="hidden lg:flex items-center gap-3"
            variants={shouldReduceMotion ? {} : MOTION_VARIANTS.container}
            initial={shouldReduceMotion ? {} : "hidden"}
            animate={shouldReduceMotion ? {} : "visible"}
          >
            <motion.div
              variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
            >
              <AnimatedButton
                variant="outline"
                animation="glow"
                ripple={!shouldReduceMotion}
                className="border-green-500 text-green-600 hover:bg-green-50"
                icon={<MessageCircle className="h-4 w-4" />}
                asChild
              >
                <a href={`https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodeURIComponent('Hello, I am interested in your vehicles')}`} target="_blank" rel="noopener noreferrer">
                  {t('cta.whatsapp')}
                </a>
              </AnimatedButton>
            </motion.div>
            <motion.div
              variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
            >
              <AnimatedButton
                animation="pulse"
                ripple={!shouldReduceMotion}
                className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white"
              >
                {t('cta.getQuote')}
              </AnimatedButton>
            </motion.div>
          </motion.div>

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
              >
                <Button variant="ghost" size="icon">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isOpen ? 'close' : 'menu'}
                      initial={shouldReduceMotion ? {} : { rotate: -90, opacity: 0 }}
                      animate={shouldReduceMotion ? {} : { rotate: 0, opacity: 1 }}
                      exit={shouldReduceMotion ? {} : { rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>
                  <motion.div
                    initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                    animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <span className="text-[var(--primary-orange)]">AUTO</span>
                    <span className="text-[var(--secondary-navy)]"> ANI</span>
                  </motion.div>
                </SheetTitle>
              </SheetHeader>
              <motion.div
                className="mt-8 flex flex-col gap-4"
                variants={shouldReduceMotion ? {} : MOTION_VARIANTS.container}
                initial={shouldReduceMotion ? {} : "hidden"}
                animate={shouldReduceMotion ? {} : "visible"}
              >
                {navigationLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium text-[var(--text-primary)] hover:text-[var(--primary-orange)] transition-colors py-2 block ${ANIMATION_CLASSES.linkHover} flex items-center gap-2`}
                    >
                      {link.icon && <link.icon className="h-5 w-5" />}
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  className="py-2"
                  variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                >
                  <FavoritesCounter variant="button" />
                </motion.div>
                <motion.div
                  className="py-2"
                  variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                >
                  <ThemeToggle variant="dropdown" showLabel={true} className="w-full justify-start" />
                </motion.div>
                <motion.div
                  variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                >
                  <AnimatedButton
                    variant="outline"
                    animation="glow"
                    ripple={!shouldReduceMotion}
                    className="mt-4 border-green-500 text-green-600 hover:bg-green-50 w-full"
                    icon={<MessageCircle className="h-4 w-4" />}
                    asChild
                  >
                    <a href={`https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodeURIComponent('Hello, I am interested in your vehicles')}`} target="_blank" rel="noopener noreferrer">
                      {t('cta.whatsapp')}
                    </a>
                  </AnimatedButton>
                </motion.div>
                <motion.div
                  variants={shouldReduceMotion ? {} : MOTION_VARIANTS.item}
                >
                  <AnimatedButton
                    animation="pulse"
                    ripple={!shouldReduceMotion}
                    className="mt-2 bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white w-full"
                  >
                    {t('cta.getQuote')}
                  </AnimatedButton>
                </motion.div>
              </motion.div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}