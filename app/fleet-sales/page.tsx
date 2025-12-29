import FleetCalculator from '@/components/fleet-sales/FleetCalculator';
import FleetBenefits from '@/components/fleet-sales/FleetBenefits';
import CaseStudies from '@/components/fleet-sales/CaseStudies';
import FleetContactForm from '@/components/fleet-sales/FleetContactForm';

export default function FleetSalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Flotë Biznesi</h1>
          <p className="text-xl opacity-90">Zbritje 5-15% | Suport Dedikuar | Dokumentim i Lehtë</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <FleetCalculator />
          <FleetContactForm />
        </div>

        <FleetBenefits />
        <CaseStudies />

        <div className="bg-white rounded-lg shadow-lg p-12 mt-16 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">FAQ - Flotë</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: 'Cila është numri minimal i makinave?', a: 'Nuk ka minimum, por zbritja fillon në 5+ makina.' },
              { q: 'A mund të zgjedh modele të ndryshme?', a: 'Po, plotë fleksibilitet në zgjedhje dhe specifikime.' },
              { q: 'Si funksionon dorëzimi?', a: 'Sipas planit tuaj. Zakonisht 2-4 javë për gati të gjitha.' },
              { q: 'A ka suport pasi-shitje?', a: 'Po, 5 vite garanci dhe shërbim mirëmbajtjeje të arritshme.' },
              { q: 'A mund të kem account manager?', a: 'Po, alokohet automatikisht për çdo flotë 8+ makinash.' },
              { q: 'Si është procesi i dokumentimit?', a: 'Plotësisht i automatizuar. Nëpërmes platformës sonë online.' },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-12 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Përditëso Flotën Tënde Tani</h2>
          <p className="mb-6 text-lg">Kursimet e mëdha dhe makinat moderne ju presin!</p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
            Kërkesë për Ofertë
          </button>
        </div>
      </div>
    </div>
  );
}
