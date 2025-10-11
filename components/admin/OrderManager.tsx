'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Package,
  CheckCircle,
  Clock,
  Search,
  Download,
  Eye,
  Edit,
  Car,
  Calendar,
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  type: 'VEHICLE' | 'PARTS' | 'SERVICE';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  estimatedDelivery?: string;
  shippingAddress?: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  vehicleId: string;
  vehicleName: string;
  depositAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  notes?: string;
}

interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  type: 'TEST_DRIVE' | 'INSPECTION' | 'SERVICE';
  vehicleId?: string;
  vehicleName?: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export default function OrderManager() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('orders');

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const [ordersResponse, reservationsResponse, appointmentsResponse] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/reservations'),
        fetch('/api/admin/appointments'),
      ]);

      const ordersData = await ordersResponse.json();
      const reservationsData = await reservationsResponse.json();
      const appointmentsData = await appointmentsResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.orders);
      } else {
        // Mock orders data
        setOrders([
          {
            id: '1',
            orderNumber: 'ORD-2024-001',
            customerName: 'Agron Musliu',
            customerEmail: 'agron@example.com',
            type: 'PARTS',
            status: 'SHIPPED',
            items: [
              { id: '1', name: 'Brake Pads Set', sku: 'BP-001', quantity: 1, price: 8500 },
              { id: '2', name: 'Air Filter', sku: 'AF-002', quantity: 2, price: 2500 },
            ],
            totalAmount: 13500,
            paymentStatus: 'PAID',
            createdAt: '2024-09-20T10:30:00Z',
            estimatedDelivery: '2024-09-25T00:00:00Z',
            shippingAddress: 'Pristina, Kosovo',
          },
          {
            id: '2',
            orderNumber: 'ORD-2024-002',
            customerName: 'Blerta Krasniqi',
            customerEmail: 'blerta@example.com',
            type: 'VEHICLE',
            status: 'CONFIRMED',
            items: [
              { id: '3', name: 'Audi A4 S-Line 2015', quantity: 1, price: 2500000 },
            ],
            totalAmount: 2500000,
            paymentStatus: 'PAID',
            createdAt: '2024-09-18T14:15:00Z',
            notes: 'Customer requested delivery on weekend',
          },
        ]);
      }

      if (reservationsData.success) {
        setReservations(reservationsData.reservations);
      } else {
        // Mock reservations data
        setReservations([
          {
            id: '1',
            customerName: 'Dardan Kastrati',
            customerEmail: 'dardan@example.com',
            vehicleId: 'v1',
            vehicleName: 'BMW 320d 2019',
            depositAmount: 100000,
            status: 'CONFIRMED',
            expiresAt: '2024-09-29T23:59:59Z',
            createdAt: '2024-09-22T09:00:00Z',
            notes: 'Customer interested in financing options',
          },
          {
            id: '2',
            customerName: 'Arta Berisha',
            customerEmail: 'arta@example.com',
            vehicleId: 'v2',
            vehicleName: 'VW Golf GTD 2017',
            depositAmount: 50000,
            status: 'PENDING',
            expiresAt: '2024-09-25T23:59:59Z',
            createdAt: '2024-09-22T11:30:00Z',
          },
        ]);
      }

      if (appointmentsData.success) {
        setAppointments(appointmentsData.appointments);
      } else {
        // Mock appointments data
        setAppointments([
          {
            id: '1',
            customerName: 'Fitore Gashi',
            customerEmail: 'fitore@example.com',
            type: 'TEST_DRIVE',
            vehicleId: 'v1',
            vehicleName: 'Skoda Superb 2020',
            scheduledAt: '2024-09-23T14:00:00Z',
            status: 'CONFIRMED',
            notes: 'Customer prefers manual transmission',
            createdAt: '2024-09-21T16:45:00Z',
          },
          {
            id: '2',
            customerName: 'Arber Hyseni',
            customerEmail: 'arber@example.com',
            type: 'INSPECTION',
            vehicleId: 'v2',
            vehicleName: 'Peugeot 3008 2018',
            scheduledAt: '2024-09-24T10:30:00Z',
            status: 'SCHEDULED',
            createdAt: '2024-09-22T12:00:00Z',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error loading order data:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadOrderData();
      }
    } catch (error) {
      logger.error('Error updating order status:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const updateReservationStatus = async (reservationId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadOrderData();
      }
    } catch (error) {
      logger.error('Error updating reservation status:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, type: 'order' | 'reservation' | 'appointment') => {
    const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      CONFIRMED: 'default',
      PROCESSING: 'default',
      SHIPPED: 'default',
      DELIVERED: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      SCHEDULED: 'secondary',
      PAID: 'default',
      FAILED: 'destructive',
      REFUNDED: 'secondary',
    };

    const variant = statusColors[status] || 'default';

    return (
      <Badge variant={variant}>
        {status.toLowerCase().replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE':
        return <Car className="w-4 h-4" />;
      case 'PARTS':
        return <Package className="w-4 h-4" />;
      case 'SERVICE':
        return <Clock className="w-4 h-4" />;
      case 'TEST_DRIVE':
        return <Car className="w-4 h-4" />;
      case 'INSPECTION':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Order Management</h2>
          <p className="text-gray-600">Manage orders, reservations, and appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders..."
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Reservations ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Appointments ({appointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getTypeIcon(order.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerEmail}</p>
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(order.status, 'order')}
                          {getStatusBadge(order.paymentStatus, 'order')}
                          <Badge variant="outline">{order.type}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Order Date</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        {order.estimatedDelivery && (
                          <div>
                            <p className="text-gray-600">Est. Delivery</p>
                            <p className="font-medium">{formatDate(order.estimatedDelivery)}</p>
                          </div>
                        )}
                        {order.shippingAddress && (
                          <div>
                            <p className="text-gray-600">Shipping To</p>
                            <p className="font-medium">{order.shippingAddress}</p>
                          </div>
                        )}
                      </div>

                      {order.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservations">
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Car className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{reservation.vehicleName}</h3>
                          <p className="text-sm text-gray-600">{reservation.customerName}</p>
                          <p className="text-xs text-gray-500">{reservation.customerEmail}</p>
                        </div>
                        {getStatusBadge(reservation.status, 'reservation')}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Deposit Amount</p>
                          <p className="font-bold">{formatCurrency(reservation.depositAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reserved Date</p>
                          <p className="font-medium">{formatDate(reservation.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expires</p>
                          <p className="font-medium">{formatDate(reservation.expiresAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-medium">{reservation.status}</p>
                        </div>
                      </div>

                      {reservation.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {reservation.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Select
                        value={reservation.status}
                        onValueChange={(value) => updateReservationStatus(reservation.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Vehicle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {getTypeIcon(appointment.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{appointment.customerName}</h3>
                          <p className="text-sm text-gray-600">{appointment.customerEmail}</p>
                          {appointment.vehicleName && (
                            <p className="text-xs text-blue-600">{appointment.vehicleName}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(appointment.status, 'appointment')}
                          <Badge variant="outline">{appointment.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Scheduled For</p>
                          <p className="font-medium">{formatDate(appointment.scheduledAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Appointment Type</p>
                          <p className="font-medium">{appointment.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Booked On</p>
                          <p className="font-medium">{formatDate(appointment.createdAt)}</p>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-800">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}