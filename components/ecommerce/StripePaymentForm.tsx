'use client';

import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Shield, CreditCard } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  amount,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setError(submitError.message || 'An error occurred');
        setLoading(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservation/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onError(confirmError.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span className="text-[var(--primary-orange)]">
              {formatCurrency(amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Element */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'ideal', 'sepa_debit'],
            }}
          />
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing Address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressElement
            options={{
              mode: 'billing',
              allowedCountries: ['XK', 'AL', 'RS', 'ME', 'MK', 'DE', 'CH', 'AT'],
            }}
          />
        </CardContent>
      </Card>

      {/* Security Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and secure. We use industry-standard SSL encryption
          to protect your data.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white"
        disabled={!stripe || loading}
        size="lg"
      >
        {loading ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Processing Payment...
          </>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </Button>

      {/* Payment Info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          By completing this payment, you agree to our terms of service.
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>256-bit SSL encrypted</span>
        </div>
      </div>

      {/* Accepted Payment Methods */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 text-center mb-2">Accepted Payment Methods:</p>
        <div className="flex justify-center space-x-4">
          <div className="bg-white border rounded px-2 py-1 text-xs font-medium">Visa</div>
          <div className="bg-white border rounded px-2 py-1 text-xs font-medium">Mastercard</div>
          <div className="bg-white border rounded px-2 py-1 text-xs font-medium">Maestro</div>
          <div className="bg-white border rounded px-2 py-1 text-xs font-medium">SEPA</div>
          <div className="bg-white border rounded px-2 py-1 text-xs font-medium">iDEAL</div>
        </div>
      </div>
    </form>
  );
}