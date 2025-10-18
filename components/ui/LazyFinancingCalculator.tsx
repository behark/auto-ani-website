'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from './button';
import { Calculator } from 'lucide-react';

// Lazy load the FinancingCalculator only when user requests it
const FinancingCalculator = dynamic(() => import('./FinancingCalculator'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <p className="text-center">Loading calculator...</p>
      </div>
    </div>
  ),
});

export default function LazyFinancingCalculator() {
  const [isOpen, setIsOpen] = useState(false);

  // Only render the button initially
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 shadow-lg"
        size="icon"
        variant="default"
        title="Financing Calculator"
      >
        <Calculator className="h-5 w-5" />
      </Button>
    );
  }

  // Load the actual component when requested
  // FinancingCalculator manages its own open/close state
  return <FinancingCalculator />;
}