'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Car, DollarSign, Camera, CheckCircle, Upload, Info, Calculator,
  TrendingUp, Star, Clock, Shield, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleMileage: number;
  vehicleCondition: string;
  hasAccidents: boolean;
  hasServiceHistory: boolean;
  photos: File[];
  additionalInfo: string;
}

const carMakes = [
  'Audi', 'BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Honda', 'Ford',
  'Peugeot', 'Renault', 'Skoda', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Volvo'
];

const conditions = [
  { value: 'excellent', label: 'Të Shkëlqyer', description: 'Si e re, pa dëmtime' },
  { value: 'very_good', label: 'Shumë Mirë', description: 'Dëmtime të vogla kozmetike' },
  { value: 'good', label: 'Mirë', description: 'Disa shenja përdorimi, por funksionale' },
  { value: 'fair', label: 'Mesatare', description: 'Dëmtime të dukshme, nevojitet riparim' },
  { value: 'poor', label: 'Dobët', description: 'Probleme serioze mekanike' }
];

export default function TradeInPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear() - 5,
    vehicleMileage: 100000,
    vehicleCondition: '',
    hasAccidents: false,
    hasServiceHistory: true,
    photos: [],
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);

  // Simple valuation algorithm (would be more sophisticated in production)
  const calculateEstimatedValue = () => {
    if (!formData.vehicleMake || !formData.vehicleYear || !formData.vehicleMileage || !formData.vehicleCondition) {
      return null;
    }

    let baseValue = 20000; // Base value

    // Adjust by make
    const premiumMakes = ['BMW', 'Mercedes', 'Audi'];
    if (premiumMakes.includes(formData.vehicleMake)) {
      baseValue *= 1.3;
    }

    // Adjust by age
    const age = new Date().getFullYear() - formData.vehicleYear;
    const depreciation = Math.pow(0.85, age); // 15% per year
    baseValue *= depreciation;

    // Adjust by mileage (above/below average)
    const averageKmPerYear = 15000;
    const expectedKm = age * averageKmPerYear;
    const mileageFactor = expectedKm / formData.vehicleMileage;
    baseValue *= Math.min(1.2, Math.max(0.7, mileageFactor));

    // Adjust by condition
    const conditionMultipliers = {
      excellent: 1.1,
      very_good: 1.0,
      good: 0.85,
      fair: 0.65,
      poor: 0.4
    };
    baseValue *= conditionMultipliers[formData.vehicleCondition as keyof typeof conditionMultipliers] || 0.85;

    // Adjust by accidents and service history
    if (formData.hasAccidents) baseValue *= 0.8;
    if (!formData.hasServiceHistory) baseValue *= 0.9;

    return Math.round(baseValue);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.photos.length > 6) {
      setError('Maksimumi 6 fotografi mund të ngarkohen');
      return;
    }
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    setError('');
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Upload photos to storage service first
      const photoUrls: string[] = []; // Will be populated after photo upload implementation

      const response = await fetch('/api/trade-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vehiclePhotos: photoUrls
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        setEstimatedValue(data.estimatedValue);
      } else {
        setError(data.error || 'Gabim në dërgimin e kërkesës');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Gabim në dërgimin e kërkesës. Ju lutem provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 4));

    // Calculate estimated value when moving to step 4
    if (step === 3) {
      const estimated = calculateEstimatedValue();
      setEstimatedValue(estimated);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Kërkesa u Dërgua!
            </h2>
            <p className="text-gray-600 mb-6">
              Vlerësimi i veturës tuaj u dërgua me sukses. Ekspertët tanë do t'ju kontaktojnë brenda 24 orëve.
            </p>

            {estimatedValue && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calculator className="text-orange-500" size={20} />
                  <span className="font-semibold text-orange-900">Vlerësim i Parë</span>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  €{estimatedValue.toLocaleString()}
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  *Vlerësim automatik - konfirmimi final nga ekspertët
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <Phone className="w-4 h-4 mr-2" />
                Kontakto: +383 49 204 242
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                setIsSubmitted(false);
                setStep(1);
                setFormData({
                  customerName: '',
                  customerEmail: '',
                  customerPhone: '',
                  vehicleMake: '',
                  vehicleModel: '',
                  vehicleYear: new Date().getFullYear() - 5,
                  vehicleMileage: 100000,
                  vehicleCondition: '',
                  hasAccidents: false,
                  hasServiceHistory: true,
                  photos: [],
                  additionalInfo: ''
                });
              }}>
                Vlerëso Veturë Tjetër
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vlerësimi i Veturës për Shkëmbim
            </h1>
            <p className="text-gray-600">
              Merrni një ofertë falas për veturën tuaj dhe përdoreni si pjesëpagesë
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {[1, 2, 3, 4].map(stepNum => (
                <div key={stepNum} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    stepNum <= step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={cn(
                      "h-1 w-16 mx-2",
                      stepNum < step ? "bg-orange-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Informacione</span>
              <span>Detaje Veture</span>
              <span>Gjendja</span>
              <span>Vlerësimi</span>
            </div>
          </div>

          {/* Form Steps */}
          <Card>
            <CardContent className="p-6">
              {/* Step 1: Customer Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Informacionet Tuaja</h2>
                    <p className="text-gray-600">Fillojmë me të dhënat bazike të kontaktit</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Emri dhe Mbiemri *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Emri juaj i plotë"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Numri i Telefonit *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+383 XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Vehicle Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Detajet e Veturës</h2>
                    <p className="text-gray-600">Tregoni për veturën që dëshironi të shkëmbeni</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake">Marka *</Label>
                      <Select value={formData.vehicleMake} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleMake: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidh markën" />
                        </SelectTrigger>
                        <SelectContent>
                          {carMakes.map(make => (
                            <SelectItem key={make} value={make}>{make}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Modeli *</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                        placeholder="p.sh. A4, X3, C-Class"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Viti *</Label>
                      <Input
                        id="vehicleYear"
                        type="number"
                        value={formData.vehicleYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: parseInt(e.target.value) || 0 }))}
                        min="1990"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vehicleMileage">Kilometrazhi (km) *</Label>
                    <Input
                      id="vehicleMileage"
                      type="number"
                      value={formData.vehicleMileage}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleMileage: parseInt(e.target.value) || 0 }))}
                      placeholder="150000"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Kilometrazhi mesatar: ~15,000 km/vit
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Condition */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Gjendja e Veturës</h2>
                    <p className="text-gray-600">Vlerësoni gjendjen aktuale të veturës tuaj</p>
                  </div>

                  <div>
                    <Label>Gjendja e Përgjithshme *</Label>
                    <div className="grid grid-cols-1 gap-3 mt-3">
                      {conditions.map(condition => (
                        <label key={condition.value} className="relative">
                          <input
                            type="radio"
                            name="condition"
                            value={condition.value}
                            checked={formData.vehicleCondition === condition.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, vehicleCondition: e.target.value }))}
                            className="sr-only"
                          />
                          <div className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-colors",
                            formData.vehicleCondition === condition.value
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-orange-200"
                          )}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{condition.label}</div>
                                <div className="text-sm text-gray-600">{condition.description}</div>
                              </div>
                              {formData.vehicleCondition === condition.value && (
                                <CheckCircle className="text-orange-500" size={20} />
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasAccidents"
                        checked={formData.hasAccidents}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAccidents: checked as boolean }))}
                      />
                      <Label htmlFor="hasAccidents">Vetura ka pasur aksidente</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasServiceHistory"
                        checked={formData.hasServiceHistory}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasServiceHistory: checked as boolean }))}
                      />
                      <Label htmlFor="hasServiceHistory">Kam historikun e shërbimeve</Label>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label>Fotografi të Veturës</Label>
                    <div className="mt-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-2">
                          Ngarkoni fotografi të qarta të veturës
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Zgjidh Fotografi
                          </Label>
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG deri në 5MB, maksimumi 6 fotografi
                        </p>
                      </div>

                      {/* Photo Previews */}
                      {formData.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {formData.photos.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additionalInfo">Informacione Shtesë</Label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      placeholder="Çdo informacion tjetër rreth veturës..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Estimated Value & Submit */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Vlerësimi i Veturës</h2>
                    <p className="text-gray-600">Bazuar në informacionet e dhëna</p>
                  </div>

                  {/* Vehicle Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Përmbledhja e Veturës</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-600">Marka:</span> <span className="font-medium">{formData.vehicleMake}</span></div>
                      <div><span className="text-gray-600">Modeli:</span> <span className="font-medium">{formData.vehicleModel}</span></div>
                      <div><span className="text-gray-600">Viti:</span> <span className="font-medium">{formData.vehicleYear}</span></div>
                      <div><span className="text-gray-600">Kilometrazhi:</span> <span className="font-medium">{formData.vehicleMileage.toLocaleString()} km</span></div>
                      <div><span className="text-gray-600">Gjendja:</span> <span className="font-medium">{conditions.find(c => c.value === formData.vehicleCondition)?.label}</span></div>
                      <div><span className="text-gray-600">Fotografi:</span> <span className="font-medium">{formData.photos.length}</span></div>
                    </div>
                  </div>

                  {/* Estimated Value */}
                  {estimatedValue && (
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 text-center">
                      <Calculator className="text-orange-500 w-12 h-12 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Vlerësimi i Parë</h3>
                      <div className="text-4xl font-bold text-orange-600 mb-2">
                        €{estimatedValue.toLocaleString()}
                      </div>
                      <p className="text-sm text-orange-700 mb-4">
                        *Ky është një vlerësim automatik bazuar në të dhënat e tregut
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <TrendingUp className="text-green-500 w-6 h-6 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Vlerë e Lartë</div>
                        </div>
                        <div>
                          <Star className="text-yellow-500 w-6 h-6 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Cilësi e Mirë</div>
                        </div>
                        <div>
                          <Shield className="text-blue-500 w-6 h-6 mx-auto mb-1" />
                          <div className="text-xs text-gray-600">Vlerësim i Sigurtë</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-500 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-medium text-blue-900">Si funksionon?</h4>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>• Ekspertët tanë do të rishikojnë informacionet</li>
                          <li>• Do t'ju kontaktojmë brenda 24 orëve</li>
                          <li>• Oferta finale pas inspektimit fizik</li>
                          <li>• Mund ta përdorni si pjesëpagesë për veturë të re</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Kthehu Prapa
                </Button>

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (step === 1 && (!formData.customerName || !formData.customerEmail || !formData.customerPhone)) ||
                      (step === 2 && (!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear)) ||
                      (step === 3 && !formData.vehicleCondition)
                    }
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Vazhdo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting ? 'Duke dërguar...' : 'Dërgo për Vlerësim'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-orange-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">Çmim i Drejtë</h3>
              <p className="text-sm text-gray-600 mt-1">Vlerësim profesional bazuar në tregun aktual</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Clock className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">Shpejtësi</h3>
              <p className="text-sm text-gray-600 mt-1">Përgjigje brenda 24 orëve</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Shield className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">Pa Detyrime</h3>
              <p className="text-sm text-gray-600 mt-1">Vlerësim falas, pa detyrime për blerje</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}