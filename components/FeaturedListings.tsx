'use client';

import { useState } from 'react';
import { VEHICLES_DATABASE } from '@/data/vehicles';

export default function FeaturedListings({ limit = 1 }) {
  const featured = VEHICLES_DATABASE.filter(v => v.featured && v.status !== 'sold').slice(0, limit);

  return (
    <div className="grid gap-8">
      {featured.map((car) => (
        <div key={car._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div>
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <img src={car.mainImage || '/placeholder.jpg'} alt={car.title} className="w-full h-full object-cover hover:scale-105 transition" />
              </div>
              {car.gallery && car.gallery.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {car.gallery.slice(0, 6).map((img, i) => (
                    <img key={i} src={img} alt={`${car.title} ${i + 1}`} className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-70" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{car.title}</h3>
                  <p className="text-gray-600">{car.year} • {car.mileage?.toLocaleString()} km</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">€{car.price.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Motori</p>
                  <p className="font-semibold">{car.engine}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Transmisioni</p>
                  <p className="font-semibold">{car.transmission}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Karburanti</p>
                  <p className="font-semibold capitalize">{car.fuelType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Kategoria</p>
                  <p className="font-semibold capitalize">{car.category}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Veçoritë Kryesore</p>
                <div className="grid grid-cols-2 gap-2">
                  {car.features?.slice(0, 12).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="capitalize text-gray-700">{f.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                  Shiko Detajet
                </button>
                <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                  Pyet Rreth Këtij
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
