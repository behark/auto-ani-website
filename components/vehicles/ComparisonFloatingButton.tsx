'use client';

import { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComparison } from '@/contexts/ComparisonContext';
import VehicleComparison from './VehicleComparison';

export default function ComparisonFloatingButton() {
  const [open, setOpen] = useState(false);
  const { comparisonList } = useComparison();

  if (comparisonList.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="relative shadow-lg bg-[var(--primary-orange)] hover:bg-orange-600"
          onClick={() => setOpen(true)}
        >
          <Scale className="w-5 h-5 mr-2" />
          Compare
          <Badge
            variant="secondary"
            className="ml-2 bg-white text-black"
          >
            {comparisonList.length}
          </Badge>
        </Button>
      </div>

      <VehicleComparison open={open} onOpenChange={setOpen} />
    </>
  );
}