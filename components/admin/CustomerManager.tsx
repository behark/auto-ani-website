'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  Search,
  Download,
  Star,
  User,
  ShoppingCart,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  registeredAt: string;
  totalSpent: number;
  totalOrders: number;
  lastActivity: string;
  status: 'ACTIVE' | 'INACTIVE' | 'VIP';
  avatar?: string;
  reservations: number;
  inquiries: number;
  favoriteVehicles: number;
}

interface Inquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  vehicleId: string;
  vehicleName: string;
  message: string;
  createdAt: string;
  status: 'NEW' | 'RESPONDED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function CustomerManager() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('customers');
  const [statusFilter] = useState('all');

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [customersResponse, inquiriesResponse] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/inquiries'),
      ]);

      const customersData = await customersResponse.json();
      const inquiriesData = await inquiriesResponse.json();

      if (customersData.success) {
        setCustomers(customersData.customers);
      }

      if (inquiriesData.success) {
        setInquiries(inquiriesData.inquiries);
      }
    } catch (error) {
      logger.error('Error loading customer data:', { error: error instanceof Error ? error.message : String(error) });
      // Mock data for development
      setCustomers([
        {
          id: '1',
          name: 'Agron Musliu',
          email: 'agron@example.com',
          phone: '+383 44 123 456',
          location: 'Pristina, Kosovo',
          registeredAt: '2024-01-15T10:00:00Z',
          totalSpent: 25000,
          totalOrders: 3,
          lastActivity: '2024-09-20T14:30:00Z',
          status: 'VIP',
          reservations: 2,
          inquiries: 5,
          favoriteVehicles: 8,
        },
        {
          id: '2',
          name: 'Blerta Krasniqi',
          email: 'blerta@example.com',
          phone: '+383 45 987 654',
          location: 'Prizren, Kosovo',
          registeredAt: '2024-03-10T09:15:00Z',
          totalSpent: 8500,
          totalOrders: 1,
          lastActivity: '2024-09-22T11:20:00Z',
          status: 'ACTIVE',
          reservations: 1,
          inquiries: 2,
          favoriteVehicles: 4,
        },
      ]);

      setInquiries([
        {
          id: '1',
          customerName: 'Agron Musliu',
          customerEmail: 'agron@example.com',
          vehicleId: 'v1',
          vehicleName: 'Audi A4 S-Line 2015',
          message: 'Interested in this vehicle. Can I schedule a test drive?',
          createdAt: '2024-09-22T10:30:00Z',
          status: 'NEW',
          priority: 'HIGH',
        },
        {
          id: '2',
          customerName: 'Blerta Krasniqi',
          customerEmail: 'blerta@example.com',
          vehicleId: 'v2',
          vehicleName: 'VW Golf 7 GTD 2017',
          message: 'What is the service history of this car?',
          createdAt: '2024-09-21T15:45:00Z',
          status: 'RESPONDED',
          priority: 'MEDIUM',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const respondToInquiry = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESPONDED' }),
      });

      if (response.ok) {
        await loadCustomerData();
      }
    } catch (error) {
      logger.error('Error responding to inquiry:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant={selectedTab === 'customers' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('customers')}
          >
            <User className="w-4 h-4 mr-2" />
            Customers ({customers.length})
          </Button>
          <Button
            variant={selectedTab === 'inquiries' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('inquiries')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Inquiries ({inquiries.filter(i => i.status === 'NEW').length} new)
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {selectedTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {getCustomerInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      customer.status === 'VIP' ? 'default' :
                      customer.status === 'ACTIVE' ? 'secondary' : 'outline'
                    }
                  >
                    {customer.status === 'VIP' && <Star className="w-3 h-3 mr-1" />}
                    {customer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>{formatCurrency(customer.totalSpent)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                    <span>{customer.totalOrders} orders</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{customer.reservations} reservations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span>{customer.inquiries} inquiries</span>
                  </div>
                </div>

                {customer.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}

                {customer.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{customer.location}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Registered: {formatDate(customer.registeredAt)}
                  <br />
                  Last activity: {formatDate(customer.lastActivity)}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'inquiries' && (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{inquiry.customerName}</h3>
                      <Badge
                        variant={
                          inquiry.status === 'NEW' ? 'destructive' :
                          inquiry.status === 'RESPONDED' ? 'default' : 'secondary'
                        }
                      >
                        {inquiry.status}
                      </Badge>
                      <Badge
                        variant={
                          inquiry.priority === 'HIGH' ? 'destructive' :
                          inquiry.priority === 'MEDIUM' ? 'default' : 'outline'
                        }
                      >
                        {inquiry.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{inquiry.customerEmail}</p>
                    <p className="font-medium text-blue-600 mb-2">{inquiry.vehicleName}</p>
                    <p className="text-gray-800 mb-3">{inquiry.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(inquiry.createdAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => respondToInquiry(inquiry.id)}
                      disabled={inquiry.status !== 'NEW'}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Respond
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Vehicle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredInquiries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inquiries found matching your criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
}