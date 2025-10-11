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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CreditCard, Banknote, Building, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vehicle } from '@/lib/types';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const ReservationSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(8, 'Phone number must be at least 8 digits'),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CASH']),
  depositType: z.enum(['PARTIAL', 'FULL']),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

type ReservationForm = z.infer<typeof ReservationSchema>;

interface VehicleReservationModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservationId: string) => void;
}

export default function VehicleReservationModal({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: VehicleReservationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReservationForm>({
    resolver: zodResolver(ReservationSchema),
    defaultValues: {
      paymentMethod: 'STRIPE',
      depositType: 'PARTIAL',
      termsAccepted: false,
    },
  });

  const watchedValues = watch();
  const depositPercentage = 20; // 20% deposit
  const depositAmount = Math.round((vehicle.price * depositPercentage) / 100);
  const totalAmount = watchedValues.depositType === 'FULL' ? vehicle.price : depositAmount;

  const paymentMethods = [
    {
      id: 'STRIPE',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Secure payment with Visa, Mastercard, etc.',
      instant: true,
    },
    {
      id: 'PAYPAL',
      name: 'PayPal',
      icon: Coins,
      description: 'Pay with your PayPal account',
      instant: true,
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer (2-3 business days)',
      instant: false,
    },
    {
      id: 'CASH',
      name: 'Cash Payment',
      icon: Banknote,
      description: 'Pay in cash at our showroom',
      instant: false,
    },
  ];

  const onSubmit = async (data: ReservationForm) => {
    setLoading(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          depositAmount: totalAmount,
          totalAmount: vehicle.price,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReservationId(result.reservation.id);

        if (data.paymentMethod === 'STRIPE' && result.clientSecret) {
          setClientSecret(result.clientSecret);
          setStep(2);
        } else {
          // For non-Stripe payments, show success immediately
          toast.success('Reservation created successfully!');
          onSuccess?.(result.reservation.id);
          handleClose();
        }
      } else {
        toast.error(result.error || 'Failed to create reservation');
      }
    } catch (error) {
      logger.error('Reservation error:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Your vehicle is reserved.');
    onSuccess?.(reservationId!);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setClientSecret(null);
    setReservationId(null);
    reset();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reserve Vehicle</DialogTitle>
          <DialogDescription>
            Secure your {vehicle.make} {vehicle.model} with a deposit
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {vehicle.images?.[0] && (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </h3>
                    <p className="text-gray-600">{vehicle.mileage?.toLocaleString()} km</p>
                    <p className="text-lg font-bold text-[var(--primary-orange)]">
                      {formatCurrency(vehicle.price)}
                    </p>
                  </div>
                </div>
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
                    <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register('customerEmail')}
                    placeholder="Enter your email"
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    {...register('customerPhone')}
                    placeholder="Enter your phone number"
                  />
                  {errors.customerPhone && (
                    <p className="text-sm text-red-500 mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deposit Type */}
                <div>
                  <Label className="text-base font-medium">Payment Amount</Label>
                  <RadioGroup
                    value={watchedValues.depositType}
                    onValueChange={(value) => setValue('depositType', value as 'PARTIAL' | 'FULL')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PARTIAL" id="partial" />
                      <Label htmlFor="partial" className="flex-1">
                        Deposit ({depositPercentage}%) - {formatCurrency(depositAmount)}
                        <span className="block text-sm text-gray-600">
                          Reserve now, pay the rest later
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FULL" id="full" />
                      <Label htmlFor="full" className="flex-1">
                        Full Payment - {formatCurrency(vehicle.price)}
                        <span className="block text-sm text-gray-600">
                          Complete purchase now
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <Label className="text-base font-medium">Payment Method</Label>
                  <RadioGroup
                    value={watchedValues.paymentMethod}
                    onValueChange={(value) => setValue('paymentMethod', value as any)}
                    className="mt-2"
                  >
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div key={method.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5" />
                              <div>
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-gray-600">{method.description}</div>
                              </div>
                              {method.instant && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  Instant
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-[var(--primary-orange)]">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={watchedValues.termsAccepted}
                      onCheckedChange={(checked: boolean) => setValue('termsAccepted', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I accept the reservation terms and conditions. The deposit is refundable within
                      48 hours. The reservation is valid for 7 days.
                    </Label>
                  </div>
                  {errors.termsAccepted && (
                    <p className="text-sm text-red-500">{errors.termsAccepted.message}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
                    disabled={loading || !watchedValues.termsAccepted}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Creating Reservation...
                      </>
                    ) : (
                      `Reserve Vehicle - ${formatCurrency(totalAmount)}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        ) : (
          // Step 2: Stripe Payment
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Complete Payment</CardTitle>
                <CardDescription>
                  Reservation ID: {reservationId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && (
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
                      amount={totalAmount}
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
              Back to Reservation Details
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}