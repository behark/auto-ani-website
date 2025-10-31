import { Car, Home, Search } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
                <Car className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Vetura nuk u gjet
              </h2>
              <p className="text-gray-600 mb-6">
                Na vjen keq, por vetura që kërkoni nuk ekziston ose është hequr nga inventari ynë.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/vehicles">
                <Button className="inline-flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4" />
                  Shfleto të Gjitha Veturat
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="inline-flex items-center gap-2 w-full sm:w-auto">
                  <Home className="w-4 h-4" />
                  Kthehu në Ballina
                </Button>
              </Link>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Përpos të shijoni koleksionin tonë të veturave të disponueshme:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Veturat e Reja</h3>
                  <p className="text-sm text-gray-600">Modelet më të fundit në stok</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">SUV & Crossover</h3>
                  <p className="text-sm text-gray-600">Veturat më të kërkuara</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Oferta Speciale</h3>
                  <p className="text-sm text-gray-600">Çmime të zvogëluara</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Keni pyetje? Na kontaktoni:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <a href="tel:+38349204242" className="text-orange-600 hover:text-orange-700 font-medium">
                    +383 49 204 242
                  </a>
                </p>
                <p className="text-sm">
                  <a href="mailto:info@autosalonani.com" className="text-orange-600 hover:text-orange-700 font-medium">
                    info@autosalonani.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
