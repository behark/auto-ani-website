'use client';

import { useState } from 'react';

export default function FleetContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Kërko Ofertë Flotë</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Emri i Kompanisë" required className="w-full p-3 border rounded-lg" />
        <input type="email" placeholder="Email" required className="w-full p-3 border rounded-lg" />
        <input type="tel" placeholder="Telefon" required className="w-full p-3 border rounded-lg" />

        <input type="number" placeholder="Numri i Makinave të Kërkuara" required className="w-full p-3 border rounded-lg" />
        <select required className="w-full p-3 border rounded-lg">
          <option>Zgjidh Llojin e Makinës</option>
          <option>SUV</option>
          <option>Sedan</option>
          <option>Kombi</option>
          <option>Përzierje</option>
        </select>

        <input type="number" placeholder="Buxheti Total (€)" required className="w-full p-3 border rounded-lg" />
        <select required className="w-full p-3 border rounded-lg">
          <option>Afati Kohor</option>
          <option>Brenda 1 muaji</option>
          <option>Brenda 3 muajve</option>
          <option>Brenda 6 muajve</option>
        </select>

        <textarea placeholder="Shënime Shtesë" className="w-full p-3 border rounded-lg h-24" />

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Dërgo Kërkesën
        </button>

        {submitted && (
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg">
            ✓ Faleminderit! Do të kontaktohemi brenda 24 orësh.
          </div>
        )}
      </form>
    </div>
  );
}
