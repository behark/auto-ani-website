export default function CaseStudies() {
  const studies = [
    {
      company: 'Taxi Prishtina',
      vehicles: 15,
      savings: '€23,600',
      period: '5 vite',
      story: 'Përditësuan flotën e tyre me 15 makina euro-4. Kursime vjetore €4,720 në sigurimin e kombinuar.',
    },
    {
      company: 'Logistika Dardania',
      vehicles: 8,
      savings: '€15,200',
      period: '3 vite',
      story: 'Zëvendësuan vanët e vjetra. Kursime të menjëhershme në karburant dhe mirëmbajtje.',
    },
    {
      company: 'Turizmi Sharri',
      vehicles: 6,
      savings: '€18,900',
      period: '4 vite',
      story: 'Ndërtuan flotën e minibusave për turizëm. Rritje të ardhurash 35% në sezonin e parë.',
    },
    {
      company: 'Shërbimi Komunal',
      vehicles: 12,
      savings: '€31,400',
      period: '6 vite',
      story: 'Përditësuan automjetet komunale. Ndryshim zero në buxhet përveçse kualiteti i shërbimit.',
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Sukseset e Flotës</h2>
        <p className="text-center text-gray-600 mb-12">Këto kumpani përgëzojnë flotë moderne dhe kursime të mëdha</p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {studies.map((s, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{s.company}</h3>
              <p className="text-gray-600 mb-4">{s.story}</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{s.vehicles}</div>
                  <p className="text-xs text-gray-600">Makina</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{s.savings}</div>
                  <p className="text-xs text-gray-600">Kursimet</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{s.period}</div>
                  <p className="text-xs text-gray-600">Periudhë</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-12">
          <h3 className="text-3xl font-bold mb-8 text-center">Statistikat e AUTO ANI Flotë</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">50+</div>
              <p className="text-sm opacity-90">Flotë të Shërbyer</p>
            </div>
            <div>
              <div className="text-4xl font-bold">€2.5M</div>
              <p className="text-sm opacity-90">Vlera e Shitjeve</p>
            </div>
            <div>
              <div className="text-4xl font-bold">€450K</div>
              <p className="text-sm opacity-90">Kursimet e Klientit</p>
            </div>
            <div>
              <div className="text-4xl font-bold">98%</div>
              <p className="text-sm opacity-90">Kënaqësia</p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Industritë e Shërbyer</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['🚕 Taksi & Transporti', '🏗️ Ndërtim', '🚚 Logjistika', '🏨 Turizmi', '🏪 Komercio', '🏥 Shëndetësia', '🏛️ Institucione', '🔧 Shërbime'].map((ind, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg text-center text-sm font-semibold">
                {ind}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
