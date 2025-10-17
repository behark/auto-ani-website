'use client';

import { useState } from 'react';
import { MessageCircle, Car, Calculator, ArrowRightLeft, Shield, Search, DollarSign, Phone } from 'lucide-react';

import { getQuickContactActions, whatsapp } from '@/lib/whatsapp-integration';

interface Vehicle {
  brand?: string;
  make?: string; // Support both naming conventions
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  status?: string;
  condition?: string;
  slug?: { current: string };
  financing?: {
    available?: boolean;
    monthlyPayment?: number;
    downPayment?: number;
  };
}

interface WhatsAppQuickActionsProps {
  vehicle: Vehicle;
  layout?: 'compact' | 'expanded' | 'floating';
  showSecondary?: boolean;
  className?: string;
}

const ACTION_ICONS = {
  inquiry: MessageCircle,
  test_drive: Car,
  financing: Calculator,
  trade_in: ArrowRightLeft,
  warranty: Shield,
  inspection: Search,
  negotiation: DollarSign,
  general: Phone
};

const ACTION_LABELS = {
  sq: {
    inquiry: 'Pyet Tani',
    test_drive: 'Test Drive',
    financing: 'Financim',
    trade_in: 'Shkëmbim',
    warranty: 'Garanci',
    inspection: 'Inspektim',
    negotiation: 'Negocio',
    general: 'Kontakt'
  },
  en: {
    inquiry: 'Ask Now',
    test_drive: 'Test Drive',
    financing: 'Financing',
    trade_in: 'Trade In',
    warranty: 'Warranty',
    inspection: 'Inspection',
    negotiation: 'Negotiate',
    general: 'Contact'
  },
  sr: {
    inquiry: 'Pitaj Sada',
    test_drive: 'Probna Vožnja',
    financing: 'Finansiranje',
    trade_in: 'Zamena',
    warranty: 'Garancija',
    inspection: 'Pregled',
    negotiation: 'Pregovori',
    general: 'Kontakt'
  }
};

export default function WhatsAppQuickActions({
  vehicle,
  layout = 'expanded',
  showSecondary = true,
  className = ''
}: WhatsAppQuickActionsProps) {
  const [language] = useState<'sq' | 'sr' | 'en'>('sq'); // You can integrate with your LanguageContext
  const [showAllActions, setShowAllActions] = useState(false);

  // Normalize vehicle data to ensure brand field exists
  const normalizedVehicle = {
    ...vehicle,
    brand: vehicle.brand || vehicle.make || 'Unknown'
  };

  const { primary, secondary } = getQuickContactActions(normalizedVehicle);
  const labels = ACTION_LABELS[language];

  // Get appropriate icon for action type
  const getActionIcon = (type: string) => {
    const IconComponent = ACTION_ICONS[type as keyof typeof ACTION_ICONS] || MessageCircle;
    return IconComponent;
  };

  // Get action color based on type
  const getActionColor = (type: string) => {
    switch (type) {
      case 'inquiry': return 'bg-green-500 hover:bg-green-600';
      case 'test_drive': return 'bg-blue-500 hover:bg-blue-600';
      case 'financing': return 'bg-orange-500 hover:bg-orange-600';
      case 'trade_in': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Get status-specific styling
  const getStatusStyling = () => {
    switch (normalizedVehicle.status) {
      case 'sold':
        return {
          buttonText: language === 'sq' ? 'Gjet të Ngjashme' : 'Find Similar',
          badgeColor: 'bg-red-500',
          badgeText: language === 'sq' ? 'E Shitur' : 'Sold'
        };
      case 'reserved':
        return {
          buttonText: language === 'sq' ? 'Lista Pritjes' : 'Waiting List',
          badgeColor: 'bg-yellow-500',
          badgeText: language === 'sq' ? 'Rezervuar' : 'Reserved'
        };
      default:
        return {
          buttonText: labels.inquiry,
          badgeColor: 'bg-green-500',
          badgeText: language === 'sq' ? 'Në Dispozicion' : 'Available'
        };
    }
  };

  const statusStyling = getStatusStyling();

  if (layout === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {/* Status Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusStyling.badgeColor}`}>
          {statusStyling.badgeText}
        </span>

        {/* Primary Action */}
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-white rounded-lg transition-colors ${getActionColor(primary.type)}`}
        >
          <MessageCircle className="w-4 h-4" />
          {statusStyling.buttonText}
        </a>
      </div>
    );
  }

  if (layout === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-3 text-white rounded-full shadow-lg transition-all hover:scale-105 ${getActionColor(primary.type)}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{statusStyling.buttonText}</span>
        </a>
      </div>
    );
  }

  // Expanded layout (default)
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${statusStyling.badgeColor}`}>
          {statusStyling.badgeText}
        </span>
        {normalizedVehicle.originalPrice && normalizedVehicle.originalPrice > normalizedVehicle.price && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            💸 Zbritje €{(normalizedVehicle.originalPrice - normalizedVehicle.price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Primary Action */}
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full text-center px-6 py-4 text-lg font-semibold text-white rounded-lg transition-all hover:scale-105 shadow-md ${getActionColor(primary.type)}`}
      >
        <MessageCircle className="w-6 h-6 inline mr-2" />
        {statusStyling.buttonText}
      </a>

      {/* Secondary Actions */}
      {showSecondary && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {secondary.slice(0, 4).map((action, index) => {
              const IconComponent = getActionIcon(action.type);
              const actionLabel = labels[action.type as keyof typeof labels] || action.type;

              return (
                <a
                  key={index}
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getActionColor(action.type)}`}
                >
                  <IconComponent className="w-4 h-4" />
                  {actionLabel}
                </a>
              );
            })}
          </div>

          {/* Show More Actions Toggle */}
          {secondary.length > 4 && (
            <>
              <button
                onClick={() => setShowAllActions(!showAllActions)}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showAllActions
                  ? (language === 'sq' ? 'Më pak opsione' : 'Fewer options')
                  : (language === 'sq' ? 'Më shumë opsione' : 'More options')
                }
              </button>

              {showAllActions && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  {secondary.slice(4).map((action, index) => {
                    const IconComponent = getActionIcon(action.type);
                    const actionLabel = labels[action.type as keyof typeof labels] || action.type;

                    return (
                      <a
                        key={index + 4}
                        href={action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getActionColor(action.type)}`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {actionLabel}
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Contact Info Footer */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        <p>{whatsapp.getBusinessInfo().businessName} • {whatsapp.getBusinessInfo().phone}</p>
        <p>{whatsapp.getBusinessInfo().hours}</p>
      </div>
    </div>
  );
}