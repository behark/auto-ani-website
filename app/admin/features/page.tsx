import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, Calendar, DollarSign, Bell, BookOpen, Users,
  TrendingUp, Star, FileText, Settings, BarChart3, Car
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Features Dashboard | AUTO ANI Admin",
  description: "Manage all AUTO ANI business features from one dashboard",
};

async function getDashboardStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auto-ani-website.onrender.com';

    // Get stats for all features
    const [testimonials, appointments, tradeIns, blogPosts] = await Promise.all([
      fetch(`${baseUrl}/api/testimonials?limit=100`).then(r => r.json()).catch(() => ({ testimonials: [] })),
      fetch(`${baseUrl}/api/appointments?limit=100`).then(r => r.json()).catch(() => ({ appointments: [] })),
      fetch(`${baseUrl}/api/trade-in?limit=100`).then(r => r.json()).catch(() => ({ valuations: [] })),
      fetch(`${baseUrl}/api/blog?limit=100`).then(r => r.json()).catch(() => ({ posts: [] }))
    ]);

    return {
      testimonials: testimonials.testimonials || [],
      appointments: appointments.appointments || [],
      tradeIns: tradeIns.valuations || [],
      blogPosts: blogPosts.posts || []
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      testimonials: [],
      appointments: [],
      tradeIns: [],
      blogPosts: []
    };
  }
}

export default async function AdminFeaturesPage() {
  const stats = await getDashboardStats();

  // Calculate metrics
  const pendingTestimonials = stats.testimonials.filter((t: any) => !t.isApproved).length;
  const pendingAppointments = stats.appointments.filter((a: any) => a.status === 'SCHEDULED').length;
  const pendingTradeIns = stats.tradeIns.filter((t: any) => t.status === 'SUBMITTED').length;
  const draftPosts = stats.blogPosts.filter((p: any) => !p.isPublished).length;

  const features = [
    {
      title: 'Customer Testimonials',
      description: 'Manage customer reviews and testimonials',
      icon: MessageSquare,
      color: 'bg-blue-500',
      stats: `${stats.testimonials.length} total, ${pendingTestimonials} pending`,
      status: pendingTestimonials > 0 ? 'warning' : 'success',
      actions: [
        { label: 'View All', href: '/admin/testimonials', variant: 'outline' as const },
        { label: 'Approve Pending', href: '/admin/testimonials?filter=pending', variant: 'default' as const }
      ]
    },
    {
      title: 'Service Appointments',
      description: 'Manage service bookings and scheduling',
      icon: Calendar,
      color: 'bg-green-500',
      stats: `${stats.appointments.length} total, ${pendingAppointments} upcoming`,
      status: pendingAppointments > 0 ? 'info' : 'success',
      actions: [
        { label: 'View Calendar', href: '/admin/appointments', variant: 'outline' as const },
        { label: 'Today\'s Schedule', href: '/admin/appointments?date=today', variant: 'default' as const }
      ]
    },
    {
      title: 'Trade-in Valuations',
      description: 'Review and approve vehicle trade-ins',
      icon: DollarSign,
      color: 'bg-yellow-500',
      stats: `${stats.tradeIns.length} total, ${pendingTradeIns} pending`,
      status: pendingTradeIns > 0 ? 'warning' : 'success',
      actions: [
        { label: 'View All', href: '/admin/trade-ins', variant: 'outline' as const },
        { label: 'Review Pending', href: '/admin/trade-ins?filter=pending', variant: 'default' as const }
      ]
    },
    {
      title: 'Blog & Content',
      description: 'Manage blog posts and marketing content',
      icon: BookOpen,
      color: 'bg-purple-500',
      stats: `${stats.blogPosts.length} total, ${draftPosts} drafts`,
      status: draftPosts > 0 ? 'info' : 'success',
      actions: [
        { label: 'View Posts', href: '/admin/blog', variant: 'outline' as const },
        { label: 'Create New', href: '/admin/blog/create', variant: 'default' as const }
      ]
    },
    {
      title: 'Inventory Alerts',
      description: 'Customer notifications and preferences',
      icon: Bell,
      color: 'bg-orange-500',
      stats: 'Email notifications for new inventory',
      status: 'success',
      actions: [
        { label: 'View Alerts', href: '/admin/alerts', variant: 'outline' as const },
        { label: 'Send Notifications', href: '/admin/alerts/send', variant: 'default' as const }
      ]
    },
    {
      title: 'Customer Analytics',
      description: 'Track customer behavior and conversions',
      icon: BarChart3,
      color: 'bg-indigo-500',
      stats: 'User tracking and insights',
      status: 'success',
      actions: [
        { label: 'View Analytics', href: '/admin/analytics', variant: 'outline' as const },
        { label: 'Generate Report', href: '/admin/analytics/report', variant: 'default' as const }
      ]
    },
    {
      title: 'Service Management',
      description: 'Technicians, parts, and service history',
      icon: Settings,
      color: 'bg-gray-600',
      stats: 'Complete service management',
      status: 'success',
      actions: [
        { label: 'Manage Services', href: '/admin/services', variant: 'outline' as const },
        { label: 'Parts Catalog', href: '/admin/parts', variant: 'default' as const }
      ]
    },
    {
      title: 'Sales Pipeline',
      description: 'Lead tracking and sales management',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      stats: 'Lead conversion tracking',
      status: 'success',
      actions: [
        { label: 'View Pipeline', href: '/admin/sales', variant: 'outline' as const },
        { label: 'Add Lead', href: '/admin/sales/lead/create', variant: 'default' as const }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Features Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Manage all AUTO ANI business features from one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={pendingTestimonials + pendingAppointments + pendingTradeIns > 0 ? "destructive" : "secondary"}>
                {pendingTestimonials + pendingAppointments + pendingTradeIns} Pending Actions
              </Badge>
              <Link href="/admin">
                <Button variant="outline">Back to Admin</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="text-yellow-500 w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.testimonials.length}</div>
              <div className="text-sm text-gray-600">Total Testimonials</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="text-blue-500 w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.appointments.length}</div>
              <div className="text-sm text-gray-600">Service Appointments</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="text-green-500 w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.tradeIns.length}</div>
              <div className="text-sm text-gray-600">Trade-in Requests</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="text-purple-500 w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.blogPosts.length}</div>
              <div className="text-sm text-gray-600">Blog Posts</div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`${feature.color} rounded-lg p-2 w-fit`}>
                    <feature.icon className="text-white" size={24} />
                  </div>
                  <Badge variant={
                    feature.status === 'warning' ? 'destructive' :
                    feature.status === 'info' ? 'default' : 'secondary'
                  }>
                    {feature.status === 'warning' ? 'Action Needed' :
                     feature.status === 'info' ? 'Active' : 'Good'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  {feature.description}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {feature.stats}
                </p>
                <div className="flex gap-2">
                  {feature.actions.map((action, actionIndex) => (
                    <Link key={actionIndex} href={action.href}>
                      <Button
                        variant={action.variant}
                        size="sm"
                        className={action.variant === 'default' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        {action.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="text-blue-500" size={20} />
                  Recent Testimonials
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.testimonials.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {stats.testimonials.slice(0, 3).map((testimonial: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{testimonial.customerName}</h4>
                          <Badge variant={testimonial.isApproved ? 'secondary' : 'destructive'}>
                            {testimonial.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{testimonial.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No testimonials yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Trade-ins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="text-green-500" size={20} />
                  Recent Trade-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.tradeIns.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {stats.tradeIns.slice(0, 3).map((tradeIn: any, index: number) => (
                      <div key={index} className="border-l-4 border-green-500 pl-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{tradeIn.customerName}</h4>
                          <Badge variant={tradeIn.status === 'SUBMITTED' ? 'destructive' : 'secondary'}>
                            {tradeIn.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {tradeIn.vehicleMake} {tradeIn.vehicleModel} ({tradeIn.vehicleYear})
                        </p>
                        {tradeIn.offerValue && (
                          <p className="text-sm font-medium text-green-600">
                            Estimated: €{tradeIn.offerValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No trade-in requests yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/admin/testimonials">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <MessageSquare size={20} />
                <span className="text-xs">Testimonials</span>
              </Button>
            </Link>

            <Link href="/admin/appointments">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <Calendar size={20} />
                <span className="text-xs">Appointments</span>
              </Button>
            </Link>

            <Link href="/admin/trade-ins">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <DollarSign size={20} />
                <span className="text-xs">Trade-ins</span>
              </Button>
            </Link>

            <Link href="/admin/blog">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <BookOpen size={20} />
                <span className="text-xs">Blog</span>
              </Button>
            </Link>

            <Link href="/admin/analytics">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <BarChart3 size={20} />
                <span className="text-xs">Analytics</span>
              </Button>
            </Link>

            <Link href="/admin/vehicles">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <Car size={20} />
                <span className="text-xs">Vehicles</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}