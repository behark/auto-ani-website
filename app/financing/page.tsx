'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FinancingCalculator from '@/components/finance/FinancingCalculator';
import {
  Calculator,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Shield,
  CheckCircle,
  Info,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';

export default function FinancingPage() {
  const [selectedOption, setSelectedOption] = useState<'loan' | 'lease' | null>(null);

  const financingOptions = [
    {
      id: 'loan',
      title: 'Auto Loan',
      description: 'Own the vehicle with monthly payments',
      icon: <CreditCard className="h-8 w-8" />,
      benefits: [
        'Build equity with each payment',
        'No mileage restrictions',
        'Freedom to modify the vehicle',
        'Keep the vehicle as long as you want'
      ],
      color: 'blue'
    },
    {
      id: 'lease',
      title: 'Auto Lease',
      description: 'Lower monthly payments, newer vehicle',
      icon: <PiggyBank className="h-8 w-8" />,
      benefits: [
        'Lower monthly payments',
        'Drive a newer vehicle with latest features',
        'Warranty coverage throughout lease',
        'Option to purchase at lease end'
      ],
      color: 'green'
    }
  ];

  const loanTips = [
    {
      title: 'Check Your Credit Score',
      description: 'A higher credit score typically means better interest rates and loan terms.'
    },
    {
      title: 'Shop Around for Rates',
      description: 'Compare offers from banks, credit unions, and dealer financing to find the best deal.'
    },
    {
      title: 'Consider Down Payment',
      description: 'A larger down payment reduces your monthly payment and total interest paid.'
    },
    {
      title: 'Understand the Terms',
      description: 'Read all loan terms carefully, including interest rate, loan length, and any fees.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Calculator className="h-10 w-10 text-[var(--primary-orange)]" />
            Vehicle Financing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore your financing options and calculate payments for your next vehicle purchase.
            Get pre-qualified today and drive away with confidence.
          </p>
        </div>

        {/* Financing Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {financingOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedOption === option.id
                  ? `ring-2 ring-${option.color}-500 shadow-lg`
                  : ''
              }`}
              onClick={() => setSelectedOption(option.id as 'loan' | 'lease')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-4 rounded-full bg-${option.color}-100 mb-4`}>
                  <div className={`text-${option.color}-600`}>
                    {option.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{option.title}</CardTitle>
                <p className="text-gray-600">{option.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {option.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${
                    option.id === 'loan'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={() => setSelectedOption(option.id as 'loan' | 'lease')}
                >
                  Calculate {option.title} Payments
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Calculator */}
        <div className="mb-12">
          <FinancingCalculator />
        </div>

        {/* Financing Tips */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Financing Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {loanTips.map((tip, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[var(--primary-orange)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">{tip.title}</h4>
                        <p className="text-gray-600 text-sm">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Pre-qualification CTA */}
            <Card className="bg-gradient-to-br from-[var(--primary-orange)] to-orange-600 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-bold mb-2">Get Pre-Qualified</h3>
                <p className="text-orange-100 mb-4 text-sm">
                  Get pre-qualified for financing and know your budget before you shop.
                </p>
                <Button className="w-full bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                  Apply Now
                </Button>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Our financing specialists are here to help you find the best option for your situation.
                </p>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Call (555) 123-4567
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Finance Team
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Special Offers */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-800 mb-2">Special Offers</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• 0% APR for qualified buyers</li>
                  <li>• $1,000 trade-in bonus</li>
                  <li>• First-time buyer programs</li>
                  <li>• Military and student discounts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Information */}
        <Alert className="max-w-4xl mx-auto">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> All calculations are estimates and for informational purposes only.
            Actual loan terms, rates, and payments may vary based on credit history, down payment, trade-in value,
            and lender requirements. Contact our financing team for personalized quotes and to discuss your specific situation.
          </AlertDescription>
        </Alert>

        {/* Browse Vehicles CTA */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Find Your Vehicle?</h3>
              <p className="text-gray-600 mb-6">
                Browse our extensive inventory of quality vehicles and use your financing calculations to make an informed decision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/vehicles">
                  <Button size="lg" className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]">
                    Browse Vehicles
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg">
                    Contact Sales Team
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}