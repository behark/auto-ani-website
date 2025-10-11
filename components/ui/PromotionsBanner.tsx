'use client';
import { useState, useEffect } from 'react';
import { X, Tag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromotionsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentPromo, setCurrentPromo] = useState(0);

  const promotions = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "0% Financing",
      description: "Available on selected models",
      cta: "Learn More"
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: "€1000 Trade-In Bonus",
      description: "When you trade in your old vehicle",
      cta: "Get Offer"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--primary-orange)] to-orange-600 text-white relative">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              {promotions[currentPromo].icon}
              <span className="font-bold text-lg">{promotions[currentPromo].title}</span>
            </div>
            <span className="hidden md:inline text-white/90">
              {promotions[currentPromo].description}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-[var(--primary-orange)] hover:bg-gray-100"
            >
              {promotions[currentPromo].cta}
            </Button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}