'use client';

import { Users, Award, Clock, Shield } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export default function WhyChooseUs() {
  const features = [
    {
      icon: Users,
      title: '2500+ Satisfied Customers',
      description: 'Over 2500 happy customers since 2015 with excellent reviews and ratings'
    },
    {
      icon: Award,
      title: '9+ Years Experience',
      description: 'Nearly a decade of expertise in the automotive industry in Kosovo'
    },
    {
      icon: Clock,
      title: 'Quick Processing',
      description: 'Fast and efficient service delivery for all your automotive needs'
    },
    {
      icon: Shield,
      title: 'Quality Guarantee',
      description: 'All vehicles come with warranty and quality certification'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Why Choose <span className="text-[var(--primary-orange)]">AUTO ANI</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trusted automotive partner in Kosovo with proven track record of excellence
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-[var(--primary-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[var(--primary-orange)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}