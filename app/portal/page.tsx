'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Car,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Inquiry {
  id: string;
  vehicleId: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    price: number;
    images: string[];
  };
  status: string;
  inquiryType: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  response?: string;
  responseDate?: Date;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  inquiries: Inquiry[];
  appointments: Array<{
    id: string;
    vehicleId: string;
    appointmentType: string;
    appointmentDate: Date;
    status: string;
  }>;
}

export default function CustomerPortal() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [activeTab, setActiveTab] = useState('inquiries');

  const sendVerificationCode = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/portal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Verification code sent to your email!');
      }
    } catch (error) {
      logger.error('Error sending verification code:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndLogin = async () => {
    if (!email || !verificationCode) return;

    setLoading(true);
    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const result = await response.json();

      if (result.success) {
        setIsVerified(true);
        setCustomerData(result.data);
      } else {
        alert('Invalid verification code');
      }
    } catch (error) {
      logger.error('Error verifying code:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-100 text-blue-700';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Customer Portal</CardTitle>
            <CardDescription>
              Track your vehicle inquiries and appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={sendVerificationCode} disabled={loading || !email}>
                  Send Code
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Verification Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <Button
              onClick={verifyAndLogin}
              disabled={loading || !email || !verificationCode}
              className="w-full"
            >
              {loading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
              Access Portal
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>We&apos;ll send you a one-time verification code to your email.</p>
              <p className="mt-2">No registration required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600 mt-1">{customerData?.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsVerified(false);
                setCustomerData(null);
                setEmail('');
                setVerificationCode('');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {customerData?.inquiries.length || 0}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {customerData?.inquiries.filter(
                      (i) => i.status !== 'CLOSED' && i.status !== 'COMPLETED'
                    ).length || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {customerData?.appointments?.length || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="inquiries">
              <MessageSquare className="w-4 h-4 mr-2" />
              My Inquiries
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries">
            <div className="space-y-6">
              {customerData?.inquiries.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No inquiries yet</p>
                  </CardContent>
                </Card>
              ) : (
                customerData?.inquiries.map((inquiry) => (
                  <Card key={inquiry.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {inquiry.vehicle.images[0] && (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Car className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {inquiry.vehicle.year} {inquiry.vehicle.make}{' '}
                              {inquiry.vehicle.model}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatCurrency(inquiry.vehicle.price)}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className={getStatusColor(inquiry.status)}>
                                {inquiry.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(inquiry.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Your Message:
                          </p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {inquiry.message || 'No message provided'}
                          </p>
                        </div>

                        {inquiry.response && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Our Response:
                            </p>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-900">{inquiry.response}</p>
                              {inquiry.responseDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Responded{' '}
                                  {formatDistanceToNow(new Date(inquiry.responseDate), {
                                    addSuffix: true,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {format(new Date(inquiry.createdAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {inquiry.inquiryType}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Vehicle
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No appointments scheduled</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contact us to schedule a test drive or viewing
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}