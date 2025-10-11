'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Wrench, Car, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleId?: string;
  serviceType: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
}

const serviceTypes = [
  { value: 'maintenance', label: 'Mirëmbajtje e Rregullt', description: 'Ndërrimi i vajit, filtrave, kontroll i përgjithshëm' },
  { value: 'repair', label: 'Riparim', description: 'Riparime mekanike, elektrike, karocerike' },
  { value: 'inspection', label: 'Kontroll Teknik', description: 'Kontroll i sigurisë, verifikim për regjistrimin' },
  { value: 'detailing', label: 'Larje dhe Detailing', description: 'Larje profesionale, polishing, mbrojtje' },
  { value: 'diagnostics', label: 'Diagnostikë', description: 'Diagnostikë kompjuterike, kontroll motorri' },
  { value: 'bodywork', label: 'Punë Karocerike', description: 'Riparim dëmtimesh, lyerje, riparim bumperash' }
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function ServiceBookingPage() {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceType: '',
    description: '',
    preferredDate: '',
    preferredTime: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots);

  // Get tomorrow as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (formData.preferredDate) {
      // TODO: Fetch available time slots for the selected date
      // For now, show all slots as available
      setAvailableSlots(timeSlots);
    }
  }, [formData.preferredDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'SERVICE',
          scheduledDate: new Date(`${formData.preferredDate}T${formData.preferredTime}`),
          scheduledTime: formData.preferredTime
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || 'Gabim në rezervimin e terminit');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('Gabim në rezervimin e terminit. Ju lutem provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-green-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Termini u Rezervua!
            </h2>
            <p className="text-gray-600 mb-6">
              Termini juaj për {formData.preferredDate} në {formData.preferredTime} u konfirmua.
              Do të kontaktoheni brenda 24 orëve për konfirmimin final.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Detajet e Terminit:</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div>📅 Data: {formData.preferredDate}</div>
                <div>🕐 Ora: {formData.preferredTime}</div>
                <div>🔧 Shërbimi: {serviceTypes.find(s => s.value === formData.serviceType)?.label}</div>
                <div>👤 Emri: {formData.customerName}</div>
                <div>📞 Telefoni: {formData.customerPhone}</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <Phone className="w-4 h-4 mr-2" />
                Kontakto: +383 49 204 242
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                Rezervo Termin Tjetër
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Rezervo Termin për Shërbim
            </h1>
            <p className="text-gray-600">
              Rezervoni një termin për mirëmbajtjen ose riparimin e veturës tuaj
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="text-orange-500" />
                    Shërbimet Tona
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serviceTypes.map(service => (
                    <div key={service.value} className="border rounded-lg p-3">
                      <h4 className="font-medium text-gray-900">{service.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Informacione Kontakti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="text-orange-500" size={18} />
                    <span>+383 49 204 242</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="text-orange-500" size={18} />
                    <span>info@autosalonani.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-orange-500" size={18} />
                    <span>Prishtinë, Kosovë</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rezervo Terminin</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Emri dhe Mbiemri *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="Emri juaj i plotë"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Numri i Telefonit *</Label>
                        <Input
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="+383 XX XXX XXX"
                          required
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
                        required
                      />
                    </div>

                    {/* Service Details */}
                    <div>
                      <Label htmlFor="serviceType">Lloji i Shërbimit *</Label>
                      <Select value={formData.serviceType} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidh llojin e shërbimit" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map(service => (
                            <SelectItem key={service.value} value={service.value}>
                              <div>
                                <div className="font-medium">{service.label}</div>
                                <div className="text-sm text-gray-500">{service.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Përshkrimi i Detajuar</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Përshkruani problemin ose shërbimin që kërkoni..."
                        rows={4}
                      />
                    </div>

                    {/* Date & Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferredDate">Data e Preferuar *</Label>
                        <Input
                          id="preferredDate"
                          type="date"
                          value={formData.preferredDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                          min={minDate}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferredTime">Ora e Preferuar *</Label>
                        <Select value={formData.preferredTime} onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Zgjidh orën" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !formData.customerName || !formData.customerPhone || !formData.preferredDate || !formData.serviceType}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Duke rezervuar...' : 'Rezervo Terminin'}
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      <p>
                        Do të kontaktoheni brenda 24 orëve për konfirmimin e terminit.
                        Orari i punës: E Hënë - E Shtunë, 08:00 - 17:00
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Service Features */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardContent className="p-4 text-center">
                    <Wrench className="text-blue-500 w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900">Teknician të Certifikuar</h3>
                    <p className="text-sm text-blue-700 mt-1">Staf profesional me eksperiencë të gjatë</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardContent className="p-4 text-center">
                    <Clock className="text-green-500 w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900">Shërbim i Shpejtë</h3>
                    <p className="text-sm text-green-700 mt-1">Punë cilësore dhe në kohë</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}