'use client';

export default function InsuranceSection() {
  const plans = [
    { name: 'Liability', monthly: 15, annual: 144, color: 'bg-blue-50' },
    { name: 'Comprehensive', monthly: 35, annual: 336, color: 'bg-green-50' },
    { name: 'Premium', monthly: 55, annual: 528, color: 'bg-purple-50' },
  ];

  return (
    <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-blue-900">Sigurimi i Makinës</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Zgjidh planin e sigurimit të përshtatshëm për nevojat e tua
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div key={plan.name} className={`${plan.color} rounded-lg p-8 border-2 border-transparent hover:border-blue-500 transition`}>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{plan.name}</h3>
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600">€{plan.monthly}</div>
                <p className="text-sm text-gray-600">per muaj</p>
                <div className="text-lg font-semibold text-gray-700 mt-2">€{plan.annual}/vit</div>
                <p className="text-xs text-green-600">8% zbritje për pagesa vjetore</p>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                Zgjidh {plan.name}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-12 mb-12">
          <h3 className="text-2xl font-bold mb-4">Paketa e Kombinuar: Financim + Sigurimi</h3>
          <p className="mb-6">Merr 15% zbritje kur kombinon financimin me sigurimin</p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">€330</div>
              <p className="text-sm opacity-90">Pagesa mujore e kombinuar</p>
            </div>
            <div>
              <div className="text-3xl font-bold">60</div>
              <p className="text-sm opacity-90">muaj financim</p>
            </div>
            <div>
              <div className="text-3xl font-bold">15%</div>
              <p className="text-sm opacity-90">zbritje totale</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Partnerit tanë të Sigurimit</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Sigal', 'Allianz', 'United Insurance', 'AIG'].map((partner) => (
              <div key={partner} className="bg-white border rounded-lg p-6 text-center font-semibold text-gray-700">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
