'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Car,
  Calendar,
  Gauge,
  Settings,
  Star,
  TrendingUp,
  CheckCircle,
  Info,
  X,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';
import { useState } from 'react';

interface VehicleData {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  transmission: 'manual' | 'automatic';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  accidents: boolean;
  serviceHistory: boolean;
  modifications: boolean;
  additionalFeatures: string[];
}

interface EstimateResult {
  estimatedValue: number;
  marketRange: { min: number; max: number };
  confidenceLevel: 'high' | 'medium' | 'low';
  factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral'; value: number }>;
  tradeInBonus: number;
  finalOffer: number;
}

const carMakes = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Toyota', 'Honda', 'Ford', 'Opel',
  'Peugeot', 'Renault', 'Skoda', 'Volvo', 'Nissan', 'Hyundai', 'Kia', 'Mazda'
];

const additionalFeatures = [
  { id: 'leather', label: 'Lëkurë / Leather', labelEn: 'Leather Seats', value: 800 },
  { id: 'sunroof', label: 'Sunroof', labelEn: 'Sunroof', value: 600 },
  { id: 'navigation', label: 'Navigim / Navigation', labelEn: 'Navigation System', value: 400 },
  { id: 'parking', label: 'Sensori Parkimi / Parking Sensors', labelEn: 'Parking Sensors', value: 300 },
  { id: 'camera', label: 'Kamera Prapa / Rear Camera', labelEn: 'Rear Camera', value: 350 },
  { id: 'heated', label: 'Ulëse të Ngrohta / Heated Seats', labelEn: 'Heated Seats', value: 400 },
  { id: 'cruise', label: 'Cruise Control', labelEn: 'Cruise Control', value: 250 },
  { id: 'xenon', label: 'Drita Xenon / Xenon Lights', labelEn: 'Xenon/LED Lights', value: 500 }
];

export default function TradeInEstimator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    make: '',
    model: '',
    year: new Date().getFullYear() - 5,
    mileage: 80000,
    condition: 'good',
    transmission: 'manual',
    fuelType: 'petrol',
    accidents: false,
    serviceHistory: true,
    modifications: false,
    additionalFeatures: []
  });
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate trade-in estimate
  const calculateEstimate = async () => {
    setIsCalculating(true);

    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Base value calculation (simplified for demo)
    let baseValue = 15000; // Base price

    // Age depreciation
    const ageDepreciation = (new Date().getFullYear() - vehicleData.year) * 1200;
    baseValue -= ageDepreciation;

    // Mileage depreciation
    const mileageDepreciation = Math.max(0, (vehicleData.mileage - 50000) / 10000) * 800;
    baseValue -= mileageDepreciation;

    // Condition adjustment
    const conditionMultipliers = {
      excellent: 1.15,
      good: 1.0,
      fair: 0.85,
      poor: 0.65
    };
    baseValue *= conditionMultipliers[vehicleData.condition];

    // Transmission bonus/penalty
    if (vehicleData.transmission === 'automatic') {
      baseValue += 1000;
    }

    // Fuel type adjustment
    const fuelTypeAdjustments = {
      petrol: 0,
      diesel: 800,
      hybrid: 2000,
      electric: 1500
    };
    baseValue += fuelTypeAdjustments[vehicleData.fuelType];

    // Additional factors
    const factors = [];

    if (!vehicleData.accidents) {
      baseValue += 1500;
      factors.push({ factor: 'Pa aksident / No accidents', impact: 'positive' as const, value: 1500 });
    } else {
      factors.push({ factor: 'Histori aksidentesh / Accident history', impact: 'negative' as const, value: -2000 });
      baseValue -= 2000;
    }

    if (vehicleData.serviceHistory) {
      baseValue += 800;
      factors.push({ factor: 'Histori mirëmbajtjeje / Service history', impact: 'positive' as const, value: 800 });
    }

    if (vehicleData.modifications) {
      baseValue -= 500;
      factors.push({ factor: 'Modifikime / Modifications', impact: 'negative' as const, value: -500 });
    }

    // Additional features
    let featuresValue = 0;
    vehicleData.additionalFeatures.forEach(featureId => {
      const feature = additionalFeatures.find(f => f.id === featureId);
      if (feature) {
        featuresValue += feature.value;
        factors.push({ factor: feature.label, impact: 'positive' as const, value: feature.value });
      }
    });
    baseValue += featuresValue;

    // Ensure minimum value
    baseValue = Math.max(2000, baseValue);

    // AUTO ANI trade-in bonus
    const tradeInBonus = 1000;
    const finalOffer = baseValue + tradeInBonus;

    // Market range (±15%)
    const marketRange = {
      min: Math.round(baseValue * 0.85),
      max: Math.round(baseValue * 1.15)
    };

    // Confidence level based on data completeness
    let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
    if (!vehicleData.serviceHistory || vehicleData.accidents) {
      confidenceLevel = 'medium';
    }
    if (vehicleData.condition === 'poor' || vehicleData.mileage > 200000) {
      confidenceLevel = 'low';
    }

    setEstimate({
      estimatedValue: Math.round(baseValue),
      marketRange,
      confidenceLevel,
      factors,
      tradeInBonus,
      finalOffer: Math.round(finalOffer)
    });

    setIsCalculating(false);
    setCurrentStep(3);
  };

  const resetEstimator = () => {
    setCurrentStep(1);
    setEstimate(null);
    setVehicleData({
      make: '',
      model: '',
      year: new Date().getFullYear() - 5,
      mileage: 80000,
      condition: 'good',
      transmission: 'manual',
      fuelType: 'petrol',
      accidents: false,
      serviceHistory: true,
      modifications: false,
      additionalFeatures: []
    });
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <TrendingUp className="h-6 w-6" />
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Vlerëso Automjetin
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Vlerësimi i Shkëmbimit</h2>
              <p className="text-purple-100 text-sm">Hapi {currentStep} / 3</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-purple-700/30 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Vehicle Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Informacionet e Automjetit</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Make & Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="inline h-4 w-4 mr-1" />
                    Marka
                  </label>
                  <select
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData(prev => ({...prev, make: e.target.value, model: ''}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="">Zgjidhni markën</option>
                    {carMakes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modeli
                  </label>
                  <input
                    type="text"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData(prev => ({...prev, model: e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="p.sh. A4, 3 Series, C-Class"
                  />
                </div>

                {/* Year & Mileage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Viti i Prodhimit
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData(prev => ({...prev, year: Number(e.target.value)}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Gauge className="inline h-4 w-4 mr-1" />
                    Kilometrazhi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vehicleData.mileage}
                    onChange={(e) => setVehicleData(prev => ({...prev, mileage: Number(e.target.value)}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="80,000"
                  />
                  <p className="text-xs text-gray-500 mt-1">km</p>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Star className="inline h-4 w-4 mr-1" />
                    Gjendja
                  </label>
                  <select
                    value={vehicleData.condition}
                    onChange={(e) => setVehicleData(prev => ({...prev, condition: e.target.value as VehicleData['condition']}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="excellent">E shkëlqyer</option>
                    <option value="good">E mirë</option>
                    <option value="fair">E pranueshme</option>
                    <option value="poor">E dobët</option>
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Settings className="inline h-4 w-4 mr-1" />
                    Transmetuesi
                  </label>
                  <select
                    value={vehicleData.transmission}
                    onChange={(e) => setVehicleData(prev => ({...prev, transmission: e.target.value as VehicleData['transmission']}))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatik</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!vehicleData.make || !vehicleData.model || !vehicleData.year}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Vazhdo <ChevronRight className="inline w-4 h-4 ml-1" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Additional Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Detaje Shtesë</h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Kthehu
                </button>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Lloji i Karburantit
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'petrol', label: 'Benzinë' },
                    { value: 'diesel', label: 'Dizell' },
                    { value: 'hybrid', label: 'Hibrid' },
                    { value: 'electric', label: 'Elektrik' }
                  ].map(fuel => (
                    <button
                      key={fuel.value}
                      onClick={() => setVehicleData(prev => ({...prev, fuelType: fuel.value as VehicleData['fuelType']}))}
                      className={`p-3 border rounded-lg transition-all ${
                        vehicleData.fuelType === fuel.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {fuel.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <span className="font-medium">A ka pasur aksidente?</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, accidents: false}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        !vehicleData.accidents
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      Jo
                    </button>
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, accidents: true}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        vehicleData.accidents
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      Po
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <span className="font-medium">Histori e plotë e mirëmbajtjes?</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, serviceHistory: true}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        vehicleData.serviceHistory
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      Po
                    </button>
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, serviceHistory: false}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        !vehicleData.serviceHistory
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      Jo
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <span className="font-medium">Modifikime të rëndësishme?</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, modifications: false}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        !vehicleData.modifications
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      Jo
                    </button>
                    <button
                      onClick={() => setVehicleData(prev => ({...prev, modifications: true}))}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        vehicleData.modifications
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      Po
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Veçori Shtesë (opsionale)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {additionalFeatures.map(feature => (
                    <label key={feature.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vehicleData.additionalFeatures.includes(feature.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVehicleData(prev => ({
                              ...prev,
                              additionalFeatures: [...prev.additionalFeatures, feature.id]
                            }));
                          } else {
                            setVehicleData(prev => ({
                              ...prev,
                              additionalFeatures: prev.additionalFeatures.filter(f => f !== feature.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">{feature.label}</span>
                      <span className="text-xs text-green-600 ml-auto">+€{feature.value}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={calculateEstimate}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Llogarit Vlerën
              </button>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {isCalculating ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Po llogaritet...</h3>
                  <p className="text-gray-600">Analizojmë të dhënat tuaja për një vlerësim të saktë</p>
                </div>
              ) : estimate && (
                <div className="space-y-6">
                  {/* Main Result */}
                  <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Vlera e Vlerësuar</h3>
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      €{estimate.estimatedValue.toLocaleString()}
                    </div>
                    <p className="text-gray-600 mb-4">
                      Diapazoni i tregut: €{estimate.marketRange.min.toLocaleString()} - €{estimate.marketRange.max.toLocaleString()}
                    </p>

                    {/* AUTO ANI Bonus */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-center mb-2">
                        <Zap className="w-5 h-5 mr-2" />
                        <span className="font-bold">Bonus AUTO ANI</span>
                      </div>
                      <div className="text-2xl font-bold">+€{estimate.tradeInBonus.toLocaleString()}</div>
                      <div className="text-sm opacity-90">Bonus shkëmbimi ekskluziv</div>
                    </div>

                    {/* Final Offer */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6">
                      <div className="text-lg font-medium mb-2">Oferta Finale</div>
                      <div className="text-5xl font-bold">€{estimate.finalOffer.toLocaleString()}</div>
                      <div className="text-sm opacity-90 mt-2">Vlera totale e shkëmbimit</div>
                    </div>
                  </div>

                  {/* Confidence Level */}
                  <div className={`p-4 rounded-lg border-2 ${
                    estimate.confidenceLevel === 'high'
                      ? 'border-green-200 bg-green-50'
                      : estimate.confidenceLevel === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className={`w-5 h-5 ${
                        estimate.confidenceLevel === 'high'
                          ? 'text-green-600'
                          : estimate.confidenceLevel === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`} />
                      <span className="font-medium">
                        Niveli i besueshmërisë: {
                          estimate.confidenceLevel === 'high' ? 'I lartë' :
                          estimate.confidenceLevel === 'medium' ? 'Mesatar' : 'I ulët'
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {estimate.confidenceLevel === 'high'
                        ? 'Vlerësimi bazohet në të dhëna të plota dhe reliable.'
                        : estimate.confidenceLevel === 'medium'
                        ? 'Vlerësimi është i mirë, por mund të ndryshojë me inspektim.'
                        : 'Kërkon inspektim të detajuar për vlerësim më të saktë.'
                      }
                    </p>
                  </div>

                  {/* Factors */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-3">Faktorët që ndikojnë në vlerë:</h4>
                    <div className="space-y-2">
                      {estimate.factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{factor.factor}</span>
                          <span className={`font-medium ${
                            factor.impact === 'positive' ? 'text-green-600' :
                            factor.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '' : ''}€{Math.abs(factor.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-3">
                    <button className="w-full bg-green-600 text-white py-4 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg">
                      Pranoni Ofertën - €{estimate.finalOffer.toLocaleString()}
                    </button>
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Rezervoni Inspektim Falas
                    </button>
                    <button
                      onClick={resetEstimator}
                      className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Vlerëso Automjet Tjetër
                    </button>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start space-x-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    <p>
                      Ky vlerësim është orientues dhe bazohet në të dhënat e dhëna. Oferta finale përcaktohet pas inspektimit fizik të automjetit nga ekspertët tanë.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}