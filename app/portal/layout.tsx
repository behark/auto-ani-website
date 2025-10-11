'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthProvider from '@/components/providers/AuthProvider';
import {
  User,
  Car,
  FileText,
  CreditCard,
  Settings,
  Bell,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  Wrench,
  TrendingUp,
  Gift,
  MessageSquare,
  ChevronDown,
  Activity,
} from 'lucide-react';

interface PortalLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/portal/dashboard',
    icon: Home,
  },
  {
    title: 'My Vehicles',
    href: '/portal/vehicles',
    icon: Car,
    subItems: [
      { title: 'Overview', href: '/portal/vehicles' },
      { title: 'Service History', href: '/portal/vehicles/service' },
      { title: 'Maintenance', href: '/portal/vehicles/maintenance' },
      { title: 'Diagnostics', href: '/portal/vehicles/diagnostics' },
    ],
  },
  {
    title: 'Documents',
    href: '/portal/documents',
    icon: FileText,
    subItems: [
      { title: 'All Documents', href: '/portal/documents' },
      { title: 'Insurance', href: '/portal/documents/insurance' },
      { title: 'Registration', href: '/portal/documents/registration' },
      { title: 'Warranty', href: '/portal/documents/warranty' },
    ],
  },
  {
    title: 'Service',
    href: '/portal/service',
    icon: Wrench,
    subItems: [
      { title: 'Schedule Service', href: '/portal/service/schedule' },
      { title: 'Service History', href: '/portal/service/history' },
      { title: 'Upcoming Appointments', href: '/portal/service/appointments' },
    ],
  },
  {
    title: 'Financing',
    href: '/portal/financing',
    icon: CreditCard,
    subItems: [
      { title: 'My Loans', href: '/portal/financing' },
      { title: 'Payment History', href: '/portal/financing/payments' },
      { title: 'Apply for Financing', href: '/portal/financing/apply' },
    ],
  },
  {
    title: 'Market Value',
    href: '/portal/market-value',
    icon: TrendingUp,
    subItems: [
      { title: 'Current Value', href: '/portal/market-value' },
      { title: 'Trade-In Calculator', href: '/portal/market-value/trade-in' },
      { title: 'Market Trends', href: '/portal/market-value/trends' },
    ],
  },
  {
    title: 'Insurance',
    href: '/portal/insurance',
    icon: Shield,
    subItems: [
      { title: 'My Policies', href: '/portal/insurance' },
      { title: 'Claims', href: '/portal/insurance/claims' },
      { title: 'Get Quote', href: '/portal/insurance/quote' },
    ],
  },
  {
    title: 'Referral Program',
    href: '/portal/referrals',
    icon: Gift,
  },
  {
    title: 'Support',
    href: '/portal/support',
    icon: MessageSquare,
  },
];

function PortalLayoutInner({ children }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Close mobile sidebar on route change
    setSidebarOpen(false);
  }, [pathname]);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <Link
            href="/portal/auth/signin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b px-4 py-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="font-semibold text-lg">AUTO ANI Portal</div>
        <button className="p-2 rounded-md hover:bg-gray-100 relative">
          <Bell size={24} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-white border-r transition-transform duration-300
            overflow-y-auto
          `}
        >
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">AUTO ANI</h1>
            <p className="text-sm text-gray-500 mt-1">Customer Portal</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {session?.user?.name || 'Customer'}
                </div>
                <div className="text-xs text-gray-500">
                  {session?.user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <div>
                    <Link
                      href={item.href}
                      onClick={() => item.subItems && toggleMenu(item.title)}
                      className={`
                        flex items-center justify-between px-3 py-2 rounded-lg
                        transition-colors duration-200
                        ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon size={20} />
                        <span>{item.title}</span>
                      </div>
                      {item.subItems && (
                        <ChevronDown
                          size={16}
                          className={`
                            transition-transform duration-200
                            ${expandedMenus.includes(item.title) ? 'rotate-180' : ''}
                          `}
                        />
                      )}
                    </Link>
                  </div>

                  {/* Sub-menu */}
                  {item.subItems && expandedMenus.includes(item.title) && (
                    <ul className="mt-1 ml-9 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={`
                              block px-3 py-2 rounded-lg text-sm
                              transition-colors duration-200
                              ${
                                pathname === subItem.href
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }
                            `}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto p-4 border-t">
            <Link
              href="/portal/settings"
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {/* Add logout handler */}}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-1"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <header className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {pathname ?
                    (() => {
                      const segment = pathname.split('/').pop();
                      return segment ?
                        segment.charAt(0).toUpperCase() + segment.slice(1)
                        : 'Dashboard';
                    })()
                    : 'Dashboard'}
                </h2>
                <nav className="text-sm text-gray-500 mt-1">
                  <Link href="/portal" className="hover:text-blue-600">
                    Home
                  </Link>
                  {pathname && pathname.split('/').slice(2).map((segment, index, array) => (
                    <span key={index}>
                      <span className="mx-2">/</span>
                      <Link
                        href={`/portal/${array.slice(0, index + 1).join('/')}`}
                        className="hover:text-blue-600"
                      >
                        {segment.charAt(0).toUpperCase() + segment.slice(1)}
                      </Link>
                    </span>
                  ))}
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                  <Activity size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <LifeBuoy size={20} />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <AuthProvider>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </AuthProvider>
  );
}