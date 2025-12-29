import Link from 'next/link';

export default function FinancingFleetCTA() {
  return (
    <div className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Zgjedhjet e Tuaja</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/financing" className="group">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-8 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer">
              <h3 className="text-3xl font-bold mb-4">💰 Financimi i Makinës</h3>
              <p className="mb-6 text-orange-100">
                Kredi me 0% interes, periudhë deri 84 muaj, me opsion sigurimi të përfshirë
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Interes 0% në të gjitha afatet</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Dokumentim 24 orësh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Sigurimi i paketizuar</span>
                </li>
              </ul>
              <div className="bg-white text-orange-600 py-2 px-4 rounded font-bold text-center group-hover:bg-orange-50 transition">
                Shfletoni Financimin
              </div>
            </div>
          </Link>

          <Link href="/fleet-sales" className="group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer">
              <h3 className="text-3xl font-bold mb-4">🚗 Flotë Biznesi</h3>
              <p className="mb-6 text-blue-100">
                Zbritje në sasi 5-15%, suport dedikuar, flesibilitet maksimal
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Zbritje për 5+ makina</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Account manager i dedikuar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Dokumentim i automatizuar</span>
                </li>
              </ul>
              <div className="bg-white text-blue-600 py-2 px-4 rounded font-bold text-center group-hover:bg-blue-50 transition">
                Shfletoni Flotën
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
