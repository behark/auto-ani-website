import type { Metadata } from 'next';

import FinancingCalculator from '@/components/financing/FinancingCalculator';
import FinancingOptions from '@/components/financing/FinancingOptions';
import PreQualificationForm from '@/components/financing/PreQualificationForm';
import StructuredData from '@/components/seo/StructuredData';
import { generatePageSchemas } from '@/lib/seo-schema';

export const metadata: Metadata = {
  title: "Financimi | AUTO ANI - Financim 0% për Vetura",
  description: "Financim i favorshëm për vetura në AUTO ANI. 0% interes, këste fleksibile deri në 84 muaj, aprovim i shpejtë. Partnerë me bankat kryesore të Kosovës.",
  keywords: "financim vetura, kredi makina, financim 0%, këste makina, kredi auto, AUTO ANI financim, banka Kosovë",
  openGraph: {
    title: "Financimi 0% për Vetura | AUTO ANI",
    description: "Financim i favorshëm me 0% interes. Këste fleksibile, aprovim i shpejtë, dokumentacion minimal.",
    type: "website",
    url: "https://autosalonani.com/financing",
  },
};

export default function FinancingPage() {
  const schemas = generatePageSchemas('financing');

  return (
    <>
      <StructuredData schemas={schemas} />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Financimi i Veturës Tuaj</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Realizoni ëndrrën tuaj me opsionet tona fleksibile të financimit.
              0% interes, aprovim i shpejtë dhe dokumentacion minimal.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--primary-orange)] mb-2">0%</div>
              <div className="text-gray-600">Interes</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--primary-orange)] mb-2">84</div>
              <div className="text-gray-600">Muaj Maksimal</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--primary-orange)] mb-2">24h</div>
              <div className="text-gray-600">Aprovim</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--primary-orange)] mb-2">10%</div>
              <div className="text-gray-600">Participim Minimal</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Financing Calculator */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Kalkulatori i Financimit</h2>
              <FinancingCalculator />
            </div>

            {/* Pre-Qualification Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Aplikoni për Financim</h2>
              <PreQualificationForm />
            </div>
          </div>

          {/* Financing Options */}
          <FinancingOptions />

          {/* Partner Banks */}
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Partnerët Tanë Bankarë</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
                <div className="text-lg font-semibold text-gray-600">ProCredit Bank</div>
              </div>
              <div className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
                <div className="text-lg font-semibold text-gray-600">Raiffeisen Bank</div>
              </div>
              <div className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
                <div className="text-lg font-semibold text-gray-600">TEB Bank</div>
              </div>
              <div className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all">
                <div className="text-lg font-semibold text-gray-600">BKT Bank</div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Pyetje të Shpeshta për Financim</h2>
            <div className="space-y-4">
              <details className="border-b pb-4">
                <summary className="cursor-pointer font-semibold text-lg">
                  Cilat dokumente nevojiten për financim?
                </summary>
                <p className="mt-3 text-gray-600">
                  Nevojiten: Letërnjoftimi, vërtetimi i të ardhurave, llogaria bankare e 3 muajve të fundit,
                  dhe kontrata e punës. Për biznesmenë: çertifikata e biznesit dhe pasqyrat financiare.
                </p>
              </details>

              <details className="border-b pb-4">
                <summary className="cursor-pointer font-semibold text-lg">
                  Sa është participimi minimal?
                </summary>
                <p className="mt-3 text-gray-600">
                  Participimi minimal është 10% të vlerës së veturës. Për klientë me histori të mirë krediture,
                  mund të ofrohen kushte edhe më të favorshme.
                </p>
              </details>

              <details className="border-b pb-4">
                <summary className="cursor-pointer font-semibold text-lg">
                  Sa kohë merr aprovimi i kredisë?
                </summary>
                <p className="mt-3 text-gray-600">
                  Aprovimi paraprak mund të merret brenda 24 orëve. Aprovimi final dhe disbursimi i kredisë
                  zakonisht përfundohet brenda 2-3 ditë pune.
                </p>
              </details>

              <details className="border-b pb-4">
                <summary className="cursor-pointer font-semibold text-lg">
                  A pranoni shkëmbim të veturës së vjetër?
                </summary>
                <p className="mt-3 text-gray-600">
                  Po, pranojmë shkëmbim të veturës tuaj të vjetër. Vlera e veturës tuaj mund të përdoret
                  si pjesë e participimit për veturën e re.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}