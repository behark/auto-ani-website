export default function FleetBenefits() {
  const benefits = [
    { icon: '💰', title: 'Çmimet Në Sasi', desc: '5-15% zbritje sipas numrit të makinave' },
    { icon: '📋', title: 'Dokumentim i Thjeshtë', desc: 'Procesi i kombinuar për të gjitha dokumentet' },
    { icon: '⚙️', title: 'Zgjedhja e Kustomizuar', desc: 'Zgjedh modelet dhe specifikimet e dëshiruara' },
    { icon: '📞', title: 'Suport Dedikuar', desc: 'Account manager i dedikuar për flotën tuaj' },
    { icon: '🚚', title: 'Dorëzim i Shpejtë', desc: 'Dorëzim në kohë sipas planit tuaj' },
    { icon: '🛠️', title: 'Shërbimi Pasi-Shitje', desc: 'Mirëmbajtje dhe zëvendësim të arritshme' },
    { icon: '💳', title: 'Terma Fleksibël', desc: '12-84 muaj financim me 0% interes' },
    { icon: '📈', title: 'ROI e Lartë', desc: 'Kursime të sigurta dhe të verified' },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Përfitime Ekskluzive të Flotës</h2>
        <p className="text-center text-gray-600 mb-12">8 arsye përse kumpanit zgjedhin AUTO ANI për flotën e tyre</p>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center">
              <div className="text-4xl mb-3">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Individuale vs Flotë</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-blue-600">
                  <th className="text-left py-3 font-bold">Karakteristika</th>
                  <th className="text-center py-3 font-bold">Individuale</th>
                  <th className="text-center py-3 font-bold text-blue-600">Flotë</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Çmimi për Makinë', '€20,000', '€17,000-€19,000'],
                  ['Zbritja', 'Nuk ka', '5-15%'],
                  ['Afati i Financimit', 'Maksimal 84 muaj', 'Fleksibël 12-84 muaj'],
                  ['Interesat', 'Sipas Bankës', '0%'],
                  ['Dokumentet', 'Manual', 'Të Automatizuara'],
                  ['Suporti', 'Standardi', 'Dedikuar'],
                ].map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-semibold">{row[0]}</td>
                    <td className="text-center py-3">{row[1]}</td>
                    <td className="text-center py-3 font-bold text-green-600">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
