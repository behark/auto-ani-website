'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  FileText,
  Shield,
  Bell,
  AlertCircle,
  Clock,
  DollarSign,
  Gauge,
  Wrench,
  Gift,
  ChevronRight,
  Activity,
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockData = {
  vehicles: [
    {
      id: '1',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2020,
      image: '/images/vehicles/mercedes-c-class.jpg',
      mileage: 25000,
      nextService: '2024-03-15',
      warrantyExpiry: '2024-08-01',
      currentValue: 35000,
      healthScore: 92,
    },
    {
      id: '2',
      make: 'BMW',
      model: 'X5',
      year: 2019,
      image: '/images/vehicles/bmw-x5.jpg',
      mileage: 45000,
      nextService: '2024-02-20',
      warrantyExpiry: '2023-12-31',
      currentValue: 48000,
      healthScore: 88,
    },
  ],
  upcomingServices: [
    {
      id: '1',
      vehicleId: '1',
      vehicle: 'Mercedes-Benz C-Class',
      type: 'Oil Change',
      date: '2024-02-20',
      time: '10:00 AM',
      location: 'AUTO ANI Service Center',
    },
    {
      id: '2',
      vehicleId: '2',
      vehicle: 'BMW X5',
      type: 'Tire Rotation',
      date: '2024-02-25',
      time: '2:00 PM',
      location: 'AUTO ANI Service Center',
    },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'service',
      title: 'Service Completed',
      description: 'Oil change for Mercedes-Benz C-Class',
      date: '2024-01-15',
      icon: Wrench,
      color: 'text-green-600',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      description: 'Monthly loan payment - BMW X5',
      date: '2024-01-10',
      icon: CreditCard,
      color: 'text-blue-600',
    },
    {
      id: '3',
      type: 'document',
      title: 'Document Added',
      description: 'Insurance renewal document uploaded',
      date: '2024-01-05',
      icon: FileText,
      color: 'text-purple-600',
    },
  ],
  alerts: [
    {
      id: '1',
      type: 'warning',
      title: 'Service Due Soon',
      description: 'BMW X5 oil change due in 500 miles',
      priority: 'medium',
    },
    {
      id: '2',
      type: 'info',
      title: 'Warranty Expiring',
      description: 'BMW X5 warranty expires on Dec 31, 2023',
      priority: 'high',
    },
    {
      id: '3',
      type: 'success',
      title: 'Referral Reward',
      description: 'You earned €50 for your recent referral',
      priority: 'low',
    },
  ],
  financials: {
    totalLoanBalance: 45000,
    monthlyPayment: 850,
    nextPaymentDate: '2024-02-01',
    totalSaved: 2500,
    referralEarnings: 250,
  },
  referralStats: {
    totalReferrals: 5,
    successfulConversions: 3,
    pendingRewards: 100,
    totalEarned: 250,
  },
};

export default function CustomerDashboard() {
  const { data: session } = useSession();
  // Vehicle selection state - reserved for future use
  // const [selectedVehicle, setSelectedVehicle] = useState(mockData.vehicles[0]);
  // const [loading, setLoading] = useState(false);

  // Quick action cards
  const quickActions = [
    {
      title: 'Schedule Service',
      description: 'Book your next maintenance',
      icon: Calendar,
      href: '/portal/service/schedule',
      color: 'bg-blue-500',
    },
    {
      title: 'View Documents',
      description: 'Access all your documents',
      icon: FileText,
      href: '/portal/documents',
      color: 'bg-green-500',
    },
    {
      title: 'Make Payment',
      description: 'Pay your loan installment',
      icon: CreditCard,
      href: '/portal/financing/payments',
      color: 'bg-purple-500',
    },
    {
      title: 'Refer a Friend',
      description: 'Earn rewards',
      icon: Gift,
      href: '/portal/referrals',
      color: 'bg-orange-500',
    },
  ];

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Customer'}!
        </h1>
        <p className="opacity-90">
          Here&apos;s an overview of your vehicles and upcoming activities
        </p>
      </div>

      {/* Alerts Section */}
      {mockData.alerts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="text-gray-600" size={20} />
              Important Alerts
            </h2>
            <Link
              href="/portal/notifications"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {mockData.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{alert.title}</h3>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    alert.priority
                  )}`}
                >
                  {alert.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}
            >
              <action.icon className="text-white" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900">{action.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* My Vehicles */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Vehicles</h2>
            <Link
              href="/portal/vehicles"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {mockData.vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-gray-500">{vehicle.year}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getHealthColor(vehicle.healthScore)}`}>
                      {vehicle.healthScore}%
                    </div>
                    <p className="text-xs text-gray-500">Health Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mileage</p>
                    <p className="font-medium flex items-center gap-1">
                      <Gauge size={16} />
                      {vehicle.mileage.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Market Value</p>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign size={16} />
                      €{vehicle.currentValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Service</p>
                    <p className="font-medium flex items-center gap-1">
                      <Wrench size={16} />
                      {new Date(vehicle.nextService).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Warranty</p>
                    <p className="font-medium flex items-center gap-1">
                      <Shield size={16} />
                      {new Date(vehicle.warrantyExpiry).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/portal/vehicles/${vehicle.id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  View Details
                  <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary & Upcoming Services */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="text-gray-600" size={20} />
              Financial Summary
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Loan Balance</span>
              <span className="font-semibold text-lg">
                €{mockData.financials.totalLoanBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Payment</span>
              <span className="font-semibold">
                €{mockData.financials.monthlyPayment}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Next Payment Due</span>
              <span className="font-medium">
                {new Date(mockData.financials.nextPaymentDate).toLocaleDateString()}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Saved</span>
                <span className="font-semibold text-green-600">
                  €{mockData.financials.totalSaved.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Referral Earnings</span>
                <span className="font-semibold text-blue-600">
                  €{mockData.financials.referralEarnings}
                </span>
              </div>
            </div>
            <Link
              href="/portal/financing"
              className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Upcoming Services */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="text-gray-600" size={20} />
              Upcoming Services
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {mockData.upcomingServices.map((service) => (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{service.type}</h3>
                    <p className="text-sm text-gray-600">{service.vehicle}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Scheduled
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(service.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {service.time}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{service.location}</p>
              </div>
            ))}
            <Link
              href="/portal/service/schedule"
              className="block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Schedule New Service
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="text-gray-600" size={20} />
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${activity.color}`}
                >
                  <activity.icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{activity.title}</h3>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral Program Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift size={24} />
            Referral Program
          </h2>
          <Link
            href="/portal/referrals"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium"
          >
            View Details
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-orange-100">Total Referrals</p>
            <p className="text-2xl font-bold">{mockData.referralStats.totalReferrals}</p>
          </div>
          <div>
            <p className="text-orange-100">Successful</p>
            <p className="text-2xl font-bold">{mockData.referralStats.successfulConversions}</p>
          </div>
          <div>
            <p className="text-orange-100">Pending Rewards</p>
            <p className="text-2xl font-bold">€{mockData.referralStats.pendingRewards}</p>
          </div>
          <div>
            <p className="text-orange-100">Total Earned</p>
            <p className="text-2xl font-bold">€{mockData.referralStats.totalEarned}</p>
          </div>
        </div>
      </div>
    </div>
  );
}