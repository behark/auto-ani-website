'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, PieChart, TrendingUp, DollarSign, Calendar, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancingCalculatorProps {
  vehiclePrice?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  className?: string;
}

interface LoanCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  paymentBreakdown: {
    principal: number;
    interest: number;
  }[];
}

interface LeaseCalculation {
  monthlyPayment: number;
  totalAmount: number;
  residualValue: number;
  depreciation: number;
}

export default function FinancingCalculator({
  vehiclePrice = 0,
  vehicleMake = '',
  vehicleModel = '',
  className
}: FinancingCalculatorProps) {
  const { t } = useLanguage();

  // Loan inputs
  const [loanPrice, setLoanPrice] = useState(vehiclePrice);
  const [downPayment, setDownPayment] = useState(0);
  const [loanTerm, setLoanTerm] = useState(60);
  const [interestRate, setInterestRate] = useState(4.5);
  const [tradeInValue, setTradeInValue] = useState(0);

  // Lease inputs
  const [leasePrice, setLeasePrice] = useState(vehiclePrice);
  const [leaseTerm, setLeaseTerm] = useState(36);
  const [leaseRate, setLeaseRate] = useState(2.9);
  const [residualPercent, setResidualPercent] = useState(60);
  const [leaseDownPayment, setLeaseDownPayment] = useState(0);

  // Active tab
  const [activeTab, setActiveTab] = useState('loan');

  // Update price when vehicle price prop changes
  useEffect(() => {
    if (vehiclePrice > 0) {
      setLoanPrice(vehiclePrice);
      setLeasePrice(vehiclePrice);
      // Set reasonable defaults based on price
      setDownPayment(Math.round(vehiclePrice * 0.2)); // 20% down
      setLeaseDownPayment(Math.round(vehiclePrice * 0.1)); // 10% down for lease
    }
  }, [vehiclePrice]);

  // Loan calculation
  const loanCalculation = useMemo((): LoanCalculation => {
    const principal = loanPrice - downPayment - tradeInValue;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm;

    if (principal <= 0 || monthlyRate <= 0 || numPayments <= 0) {
      return {
        monthlyPayment: 0,
        totalInterest: 0,
        totalAmount: 0,
        paymentBreakdown: []
      };
    }

    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalAmount = monthlyPayment * numPayments;
    const totalInterest = totalAmount - principal;

    // Calculate payment breakdown for each month
    const paymentBreakdown = [];
    let remainingBalance = principal;

    for (let i = 0; i < numPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      paymentBreakdown.push({
        principal: principalPayment,
        interest: interestPayment
      });
    }

    return {
      monthlyPayment,
      totalInterest,
      totalAmount,
      paymentBreakdown
    };
  }, [loanPrice, downPayment, tradeInValue, loanTerm, interestRate]);

  // Lease calculation
  const leaseCalculation = useMemo((): LeaseCalculation => {
    const capitalized = leasePrice - leaseDownPayment - tradeInValue;
    const residualValue = leasePrice * (residualPercent / 100);
    const depreciation = capitalized - residualValue;
    const monthlyRate = leaseRate / 100 / 12;

    if (capitalized <= 0 || leaseTerm <= 0) {
      return {
        monthlyPayment: 0,
        totalAmount: 0,
        residualValue: 0,
        depreciation: 0
      };
    }

    // Simplified lease calculation
    const depreciationPayment = depreciation / leaseTerm;
    const financePayment = (capitalized + residualValue) * monthlyRate;
    const monthlyPayment = depreciationPayment + financePayment;
    const totalAmount = monthlyPayment * leaseTerm;

    return {
      monthlyPayment,
      totalAmount,
      residualValue,
      depreciation
    };
  }, [leasePrice, leaseDownPayment, tradeInValue, leaseTerm, leaseRate, residualPercent]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAffordabilityColor = (payment: number) => {
    if (payment < 300) return 'text-green-600';
    if (payment < 500) return 'text-yellow-600';
    if (payment < 700) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Financing Calculator
          {vehicleMake && vehicleModel && (
            <Badge variant="outline" className="ml-2">
              {vehicleMake} {vehicleModel}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loan">Finance (Loan)</TabsTrigger>
            <TabsTrigger value="lease">Lease</TabsTrigger>
          </TabsList>

          {/* Loan Calculator */}
          <TabsContent value="loan" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Loan Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Loan Details
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="loanPrice">Vehicle Price</Label>
                    <Input
                      id="loanPrice"
                      type="number"
                      value={loanPrice}
                      onChange={(e) => setLoanPrice(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="downPayment">Down Payment</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                    />
                    <div className="mt-2">
                      <Slider
                        value={[downPayment]}
                        onValueChange={(value) => setDownPayment(value[0])}
                        max={loanPrice * 0.5}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>$0</span>
                        <span>{Math.round((downPayment / loanPrice) * 100)}%</span>
                        <span>{formatCurrency(loanPrice * 0.5)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tradeInValue">Trade-in Value</Label>
                    <Input
                      id="tradeInValue"
                      type="number"
                      value={tradeInValue}
                      onChange={(e) => setTradeInValue(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="loanTerm">Loan Term</Label>
                    <Select value={loanTerm.toString()} onValueChange={(value) => setLoanTerm(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="36">36 months (3 years)</SelectItem>
                        <SelectItem value="48">48 months (4 years)</SelectItem>
                        <SelectItem value="60">60 months (5 years)</SelectItem>
                        <SelectItem value="72">72 months (6 years)</SelectItem>
                        <SelectItem value="84">84 months (7 years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                    />
                    <div className="mt-2">
                      <Slider
                        value={[interestRate]}
                        onValueChange={(value) => setInterestRate(value[0])}
                        min={1}
                        max={15}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1%</span>
                        <span>Current: {interestRate}%</span>
                        <span>15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Summary
                </h3>

                <div className="space-y-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Monthly Payment</p>
                        <p className={`text-3xl font-bold ${getAffordabilityColor(loanCalculation.monthlyPayment)}`}>
                          {formatCurrency(loanCalculation.monthlyPayment)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-gray-600">Total Interest</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(loanCalculation.totalInterest)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-gray-600">Total Amount</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(loanCalculation.totalAmount)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Loan Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Vehicle Price:</span>
                          <span>{formatCurrency(loanPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Down Payment:</span>
                          <span className="text-green-600">-{formatCurrency(downPayment)}</span>
                        </div>
                        {tradeInValue > 0 && (
                          <div className="flex justify-between">
                            <span>Trade-in Value:</span>
                            <span className="text-green-600">-{formatCurrency(tradeInValue)}</span>
                          </div>
                        )}
                        <hr />
                        <div className="flex justify-between font-medium">
                          <span>Amount Financed:</span>
                          <span>{formatCurrency(loanPrice - downPayment - tradeInValue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {loanCalculation.monthlyPayment > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This calculation is an estimate. Actual rates and terms may vary based on credit score,
                        lender, and other factors.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Lease Calculator */}
          <TabsContent value="lease" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lease Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lease Details
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="leasePrice">Vehicle Price (MSRP)</Label>
                    <Input
                      id="leasePrice"
                      type="number"
                      value={leasePrice}
                      onChange={(e) => setLeasePrice(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="leaseDownPayment">Down Payment</Label>
                    <Input
                      id="leaseDownPayment"
                      type="number"
                      value={leaseDownPayment}
                      onChange={(e) => setLeaseDownPayment(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="leaseTerm">Lease Term</Label>
                    <Select value={leaseTerm.toString()} onValueChange={(value) => setLeaseTerm(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 months (2 years)</SelectItem>
                        <SelectItem value="36">36 months (3 years)</SelectItem>
                        <SelectItem value="48">48 months (4 years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="leaseRate">Money Factor (APR %)</Label>
                    <Input
                      id="leaseRate"
                      type="number"
                      step="0.1"
                      value={leaseRate}
                      onChange={(e) => setLeaseRate(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="residualPercent">Residual Value (%)</Label>
                    <Input
                      id="residualPercent"
                      type="number"
                      value={residualPercent}
                      onChange={(e) => setResidualPercent(Number(e.target.value))}
                    />
                    <div className="mt-2">
                      <Slider
                        value={[residualPercent]}
                        onValueChange={(value) => setResidualPercent(value[0])}
                        min={30}
                        max={80}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>30%</span>
                        <span>{formatCurrency(leasePrice * (residualPercent / 100))}</span>
                        <span>80%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lease Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Lease Summary
                </h3>

                <div className="space-y-3">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Monthly Lease Payment</p>
                        <p className={`text-3xl font-bold ${getAffordabilityColor(leaseCalculation.monthlyPayment)}`}>
                          {formatCurrency(leaseCalculation.monthlyPayment)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-gray-600">Total Lease Cost</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(leaseCalculation.totalAmount)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-gray-600">Residual Value</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(leaseCalculation.residualValue)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Lease Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Vehicle MSRP:</span>
                          <span>{formatCurrency(leasePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Down Payment:</span>
                          <span className="text-green-600">-{formatCurrency(leaseDownPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Residual Value:</span>
                          <span>{formatCurrency(leaseCalculation.residualValue)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-medium">
                          <span>Depreciation:</span>
                          <span>{formatCurrency(leaseCalculation.depreciation)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {leaseCalculation.monthlyPayment > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Lease payments are typically lower than loan payments, but you won&apos;t own the vehicle.
                        Additional fees may apply.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Comparison */}
        {loanCalculation.monthlyPayment > 0 && leaseCalculation.monthlyPayment > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Loan vs Lease Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-700">Finance (Loan)</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(loanCalculation.monthlyPayment)}/mo
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    You&apos;ll own the vehicle after {loanTerm} months
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-700">Lease</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(leaseCalculation.monthlyPayment)}/mo
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Lower payments, return after {leaseTerm} months
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Monthly savings with lease: {' '}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(loanCalculation.monthlyPayment - leaseCalculation.monthlyPayment)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}