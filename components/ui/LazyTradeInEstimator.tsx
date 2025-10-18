'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from './button';
import { Car } from 'lucide-react';

// Lazy load the TradeInEstimator only when user requests it
const TradeInEstimator = dynamic(() => import('./TradeInEstimator'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <p className="text-center">Loading trade-in estimator...</p>
      </div>
    </div>
  ),
});

export default function LazyTradeInEstimator() {
  const [isOpen, setIsOpen] = useState(false);

  // Only render the button initially
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-40 right-4 z-40 shadow-lg"
        size="icon"
        variant="outline"
        title="Trade-In Estimator"
      >
        <Car className="h-5 w-5" />
      </Button>
    );
  }

  // Load the actual component when requested
  // TradeInEstimator manages its own open/close state
  return <TradeInEstimator />;
}