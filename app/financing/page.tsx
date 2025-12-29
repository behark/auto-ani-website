import EnhancedFinancingCalculator from '@/components/financing/EnhancedFinancingCalculator';
import InsuranceSection from '@/components/financing/InsuranceSection';
import FeaturedListings from '@/components/FeaturedListings';

export default function FinancingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Financim i Makinës</h1>
          <p className="text-xl opacity-90">0% interes | Deri 84 muaj | Dokumentim i shpejtë</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <EnhancedFinancingCalculator />
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">Kërkesa për Financim</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Emri i Plotë" required className="w-full p-3 border rounded-lg" />
              <input type="email" placeholder="Email" required className="w-full p-3 border rounded-lg" />
              <input type="tel" placeholder="Telefon" required className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="Makina e Dëshiruar" required className="w-full p-3 border rounded-lg" />
              <textarea placeholder="Shënime Shtesë" className="w-full p-3 border rounded-lg h-20" />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                Dërgo Kërkesën
              </button>
            </form>
          </div>
        </div>

        <InsuranceSection />

        <div className="py-16">
          <h2 className="text-3xl font-bold mb-8 text-blue-900">Shiko Financimin në Praktikë</h2>
          <FeaturedListings limit={1} />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">Pyetjet Më të Shpeshta</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: 'Cili është përqindja e interesit?', a: 'Financim me 0% interes në të gjitha periudhëve.' },
              { q: 'Cila është periudha maksimale?', a: 'Periudha maksimale është 84 muaj (7 vite).' },
              { q: 'A mund të paguaj më shpejt?', a: 'Po, mund të paguash më shpejt pa penalitete shtesë.' },
              { q: 'Si funksionon sigurimi i kombinuar?', a: 'Lidhni sigurimin direkt me financimin për zbritje 15%.' },
              { q: 'Çfarë duhet për të aplikuar?', a: 'ID, dokumente të ardhurash dhe një depozitë minimale.' },
              { q: 'Sa shpejt shqyrtohet kërkesa?', a: 'Përgjigje në 24 orë. Dokumentet në 48 orë.' },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-12 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Gata për të Filluar?</h2>
          <p className="mb-6 text-lg">Plotëso formën dhe zgjidh makinën e ëndrrës tuaj sot!</p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
            Kërkesë e Shpejtë
          </button>
        </div>
      </div>
    </div>
  );
}
