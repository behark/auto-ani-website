'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  X,
  ChevronUp,
  Send
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { COMPANY_INFO } from '@/lib/constants';
import { whatsapp } from '@/lib/whatsapp-integration';

interface ContactMethod {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  bgColor: string;
  hoverColor: string;
  textColor: string;
}

export default function FloatingContactWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [timeUntilChange, setTimeUntilChange] = useState('');

  // Check business hours
  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      let isOpen = false;
      let nextChange = '';

      if (currentDay === 0) {
        // Sunday - Closed
        isOpen = false;
        nextChange = 'Opens Monday at 9:00 AM';
      } else if (currentDay === 6) {
        // Saturday
        if (currentHour >= 9 && currentHour < 17) {
          isOpen = true;
          nextChange = `Closes at 5:00 PM`;
        } else {
          isOpen = false;
          nextChange = currentHour < 9 ? 'Opens at 9:00 AM' : 'Opens Monday at 9:00 AM';
        }
      } else {
        // Monday - Friday
        if (currentHour >= 9 && currentHour < 19) {
          isOpen = true;
          nextChange = `Closes at 7:00 PM`;
        } else {
          isOpen = false;
          nextChange = currentHour < 9 ? 'Opens at 9:00 AM' : 'Opens tomorrow at 9:00 AM';
        }
      }

      setIsBusinessOpen(isOpen);
      setTimeUntilChange(nextChange);
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const contactMethods: ContactMethod[] = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      action: () => {
        const generalInquiry = whatsapp.generateGeneralInquiry();
        window.open(generalInquiry.url, '_blank');
      },
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Call Us',
      action: () => {
        window.open(`tel:${COMPANY_INFO.phone}`, '_self');
      },
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      action: () => {
        const subject = 'Interes për Automjete - AUTO ANI';
        const body = 'Përshëndetje,\n\nJam i interesuar për automjetet tuaja dhe do të doja më shumë informacione.\n\nFaleminderit!';
        window.open(`mailto:${COMPANY_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
      },
      bgColor: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
      textColor: 'text-white'
    },
    {
      id: 'location',
      icon: MapPin,
      label: 'Location',
      action: () => {
        const address = encodeURIComponent(COMPANY_INFO.address);
        window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
      },
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      textColor: 'text-white'
    }
  ];

  const primaryContact = contactMethods[0]; // WhatsApp as primary

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-72"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AA</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">AUTO ANI</h3>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isBusinessOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs ${isBusinessOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {isBusinessOpen ? 'Hapur tani' : 'Mbyllur'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Business Hours Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Oraret e Punës</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Hën - Pre:</span>
                  <span className="font-medium">{COMPANY_INFO.hours.weekdays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shtunë:</span>
                  <span className="font-medium">{COMPANY_INFO.hours.saturday}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diel:</span>
                  <span className="font-medium">{COMPANY_INFO.hours.sunday}</span>
                </div>
              </div>
              {timeUntilChange && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  {timeUntilChange}
                </div>
              )}
            </div>

            {/* Contact Methods */}
            <div className="space-y-2">
              {contactMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      method.action();
                      setIsExpanded(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${method.bgColor} ${method.hoverColor} ${method.textColor} hover:scale-105 active:scale-95`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{method.label}</span>
                    <Send className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{COMPANY_INFO.stats.vehiclesSold}+</div>
                  <div className="text-xs text-gray-600">Automjete Shitur</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{COMPANY_INFO.stats.yearsInBusiness}+</div>
                  <div className="text-xs text-gray-600">Vite Përvojë</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative ${primaryContact.bgColor} ${primaryContact.hoverColor} ${primaryContact.textColor} p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
      >
        {/* Business Status Indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isBusinessOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>

        {/* Pulse Animation when business is open */}
        {isBusinessOpen && (
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping"></div>
        )}

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <primaryContact.icon className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        {!isExpanded && (
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {isBusinessOpen ? 'Kontaktoni tani - Jemi hapur!' : 'Kontaktoni ne - Përgjigjemi shpejt!'}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        )}
      </motion.button>

      {/* Screen Reader Support */}
      <span className="sr-only">
        Contact AUTO ANI - {isBusinessOpen ? 'Currently open' : 'Currently closed'}.
        Multiple contact methods available including WhatsApp, phone, email, and location.
      </span>
    </div>
  );
}