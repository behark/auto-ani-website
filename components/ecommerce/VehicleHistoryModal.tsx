'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Shield,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Vehicle } from '@/lib/types';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ReportRequestSchema = z.object({
  provider: z.enum(['CARFAX', 'AUTOCHECK']),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
});

type ReportRequestForm = z.infer<typeof ReportRequestSchema>;

interface VehicleHistoryModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reportData: any) => void;
}

interface ReportProvider {
  id: 'CARFAX' | 'AUTOCHECK';
  name: string;
  price: number;
  currency: string;
  features: string[];
  description: string;
  logo?: string;
}

export default function VehicleHistoryModal({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: VehicleHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [availableReports, setAvailableReports] = useState<ReportProvider[]>([]);
  const [existingReports, setExistingReports] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'CARFAX' | 'AUTOCHECK'>('CARFAX');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReportRequestForm>({
    resolver: zodResolver(ReportRequestSchema),
    defaultValues: {
      provider: 'CARFAX',
    },
  });

  const watchedValues = watch();

  // Load available reports when modal opens
  useState(() => {
    if (isOpen) {
      loadAvailableReports();
    }
  });

  const loadAvailableReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vehicle-history?vehicleId=${vehicle.id}`);
      const result = await response.json();

      if (result.success) {
        setAvailableReports(result.availableReports);
        setExistingReports(result.existingReports);
      } else {
        toast.error(result.error || 'Failed to load report information');
      }
    } catch (error) {
      logger.error('Error loading reports:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to load report information');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleReport = async (provider: 'CARFAX' | 'AUTOCHECK') => {
    try {
      const response = await fetch(`/api/vehicle-history?action=sample&provider=${provider}`);
      const result = await response.json();

      if (result.success) {
        setSampleData(result.sampleData);
      }
    } catch (error) {
      logger.error('Error loading sample report:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const onSubmit = async (data: ReportRequestForm) => {
    setLoading(true);

    try {
      const response = await fetch('/api/vehicle-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          provider: data.provider,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.cached) {
          // Report already exists
          toast.success('Report retrieved successfully!');
          onSuccess?.(result.report);
          handleClose();
        } else {
          // Payment required
          setReportId(result.reportId);
          setPaymentIntentId(result.paymentIntentId);
          setClientSecret(result.clientSecret);
          setStep(2);
        }
      } else {
        toast.error(result.error || 'Failed to request report');
      }
    } catch (error) {
      logger.error('Report request error:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!reportId || !paymentIntentId) {
      toast.error('Missing report or payment information');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/vehicle-history?reportId=${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Vehicle history report generated successfully!');
        onSuccess?.(result.report);
        handleClose();
      } else {
        toast.error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      logger.error('Report generation error:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setClientSecret(null);
    setReportId(null);
    setPaymentIntentId(null);
    setSampleData(null);
    reset();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const selectedProviderData = availableReports.find(r => r.id === selectedProvider);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vehicle History Report</DialogTitle>
          <DialogDescription>
            Get detailed history for {vehicle.make} {vehicle.model} {vehicle.year}
          </DialogDescription>
        </DialogHeader>

        {loading && !availableReports.length ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : step === 1 ? (
          <Tabs defaultValue="purchase" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase">Purchase Report</TabsTrigger>
              <TabsTrigger value="existing">Existing Reports</TabsTrigger>
              <TabsTrigger value="sample">Sample Report</TabsTrigger>
            </TabsList>

            <TabsContent value="purchase" className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Vehicle Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Car className="w-5 h-5 mr-2" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Vehicle</Label>
                        <p className="font-medium">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">VIN</Label>
                        <p className="font-mono text-sm">
                          {vehicle.vin || 'VIN not available'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Providers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Choose Report Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedProvider}
                      onValueChange={(value) => {
                        setSelectedProvider(value as 'CARFAX' | 'AUTOCHECK');
                        setValue('provider', value as 'CARFAX' | 'AUTOCHECK');
                      }}
                      className="space-y-4"
                    >
                      {availableReports.map((provider) => (
                        <div key={provider.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
                          <Label htmlFor={provider.id} className="flex-1 cursor-pointer">
                            <Card className="border-2 hover:border-blue-200 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {formatCurrency(provider.price)}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Instant
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {provider.features.map((feature, index) => (
                                    <div key={index} className="flex items-center text-sm">
                                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                      {feature}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Full Name *</Label>
                      <Input
                        id="customerName"
                        {...register('customerName')}
                        placeholder="Enter your full name"
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email Address *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        {...register('customerEmail')}
                        placeholder="Enter your email for report delivery"
                      />
                      {errors.customerEmail && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.customerEmail.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Summary */}
                {selectedProviderData && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center text-lg font-semibold mb-4">
                        <span>Total Amount:</span>
                        <span className="text-blue-600">
                          {formatCurrency(selectedProviderData.price)}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Purchase Report - {formatCurrency(selectedProviderData.price)}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </form>
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              {existingReports.length > 0 ? (
                existingReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{report.provider} Report</h3>
                          <p className="text-sm text-gray-600">
                            Purchased: {new Date(report.purchaseDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Valid until: {new Date(report.validUntil).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No existing reports found for this vehicle.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sample" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => loadSampleReport('CARFAX')}
                  className="h-20"
                >
                  <div className="text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2" />
                    <span>View CARFAX Sample</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadSampleReport('AUTOCHECK')}
                  className="h-20"
                >
                  <div className="text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2" />
                    <span>View AutoCheck Sample</span>
                  </div>
                </Button>
              </div>

              {sampleData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Report Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                      {JSON.stringify(sampleData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Step 2: Payment
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Complete Payment</CardTitle>
                <CardDescription>
                  Report ID: {reportId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && selectedProviderData && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                      },
                    }}
                  >
                    <StripePaymentForm
                      amount={selectedProviderData.price}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => {
                        toast.error(error);
                        setStep(1);
                      }}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="w-full"
            >
              Back to Report Selection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}