'use client';

import { Wifi, RefreshCw, Home, Phone, MapPin, Clock, Mail, MessageCircle, Globe, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check immediately
    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const businessInfo = {
    name: 'AUTO ANI - Auto Salon Premium',
    address: 'Prishtinë, Kosovë',
    phone: '+383 49 204 242',
    whatsapp: '+383 49 204 242',
    email: 'info@autosalonani.com',
    website: 'www.autosalonani.com',
    hours: {
      weekdays: '08:00 - 20:00',
      saturday: '08:00 - 18:00',
      sunday: '10:00 - 16:00'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Offline Card */}
        <Card className="bg-gray-900/80 border-gray-700 text-white backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-orange-500/20 rounded-full w-20 h-20 flex items-center justify-center">
              <Wifi className={`h-10 w-10 ${isOnline ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isOnline ? 'Lidhja u Rikthye!' : 'Jo Koneksion'}
            </CardTitle>
            <p className="text-gray-400">
              {isOnline
                ? 'Lidhja me internetin u rikthye. Mund të vazhdoni përdorimin normal.'
                : 'Nuk keni lidhje me internetin. Disa përmbajtje janë të disponueshme offline.'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Offline Capabilities */}
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-orange-500 flex items-center justify-center gap-2">
                <Car className="h-4 w-4" />
                Funksionet Offline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-green-400">✓</span> Vetura të ruajtura
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-green-400">✓</span> Përshkrime automjetesh
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-green-400">✓</span> Foto automjetesh
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-green-400">✓</span> Informacione kontakti
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isOnline}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isOnline ? 'Online!' : `Provo Përsëri ${retryCount > 0 ? `(${retryCount})` : ''}`}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-800 text-white">
                    <Home className="mr-2 h-4 w-4" />
                    Ballore
                  </Button>
                </Link>

                <Link href="/vehicles" className="block">
                  <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-800 text-white">
                    <Car className="mr-2 h-4 w-4" />
                    Vetura
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Contact Information */}
        <Card className="bg-gray-900/80 border-gray-700 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center text-orange-500">
              Informacionet e Kontaktit
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Business Name */}
            <div className="text-center">
              <h2 className="text-lg font-bold">{businessInfo.name}</h2>
              <p className="text-gray-400">Auto Salon Premium në Kosovë</p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Contact Methods */}
            <div className="space-y-4">
              {/* Phone */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Phone className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Telefon</p>
                  <a
                    href={`tel:${businessInfo.phone}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {businessInfo.phone}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">WhatsApp</p>
                  <a
                    href={`https://wa.me/${businessInfo.whatsapp.replace(/[^\d]/g, '')}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {businessInfo.whatsapp}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Email</p>
                  <a
                    href={`mailto:${businessInfo.email}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {businessInfo.email}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Adresa</p>
                  <p className="text-gray-300">{businessInfo.address}</p>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Globe className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Website</p>
                  <p className="text-gray-300">{businessInfo.website}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Business Hours */}
            <div className="space-y-3">
              <h3 className="font-semibold text-orange-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Orari i Punës
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Hënë - Premte:</span>
                  <span className="text-white">{businessInfo.hours.weekdays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Shtunë:</span>
                  <span className="text-white">{businessInfo.hours.saturday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Diel:</span>
                  <span className="text-white">{businessInfo.hours.sunday}</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <Separator className="bg-gray-700" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-orange-500">Shërbimet Tona</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div>🚗 Shitje Automjetesh</div>
                <div>💰 Financim</div>
                <div>🔧 Servisim</div>
                <div>📋 Regjistrim</div>
                <div>🔄 Këmbim</div>
                <div>🛡️ Garanci</div>
              </div>
            </div>

            {/* Offline Note */}
            <div className="text-center p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-300">
                💡 Kjo faqe funksionon edhe pa internet për t'ju ndihmuar të na kontaktoni.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}