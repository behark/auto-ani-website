'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Ballina', href: '/' },
    { name: 'Veturat', href: '/vehicles' },
    { name: 'Shërbimet', href: '/services' },
    { name: 'Shkëmbim', href: '/trade-in' },
    { name: 'Kontakt', href: '/contact' }
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

          {/* Phone Number */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:+38349123456"
              className="flex items-center space-x-2 text-[var(--primary-orange)] hover:text-orange-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">+383 49 123 456</span>
            </a>
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
                  href="tel:+38349123456"
                  className="flex items-center space-x-2 text-[var(--primary-orange)] hover:text-orange-600 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">+383 49 123 456</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}