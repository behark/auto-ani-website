'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Plus,
  Edit,
  Trash2,
  Target,
  DollarSign,
  Percent,
  Car,
  Save,
  Copy,
  Play,
  Pause,
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BOGO';
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    applicableVehicles?: string[];
    applicableParts?: string[];
    customerSegments?: string[];
    maxUses?: number;
    maxUsesPerCustomer?: number;
  };
  usage: {
    totalUses: number;
    totalRevenue: number;
    conversionRate: number;
  };
  createdAt: string;
}

export default function PromotionManager() {
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    maxUses: '',
    maxUsesPerCustomer: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/promotions');
      const result = await response.json();

      if (result.success) {
        setPromotions(result.promotions);
      } else {
        // Mock data for development
        setPromotions([
          {
            id: '1',
            name: 'Summer Sale 2024',
            description: '15% off all vehicles under €20,000',
            type: 'PERCENTAGE',
            value: 15,
            startDate: '2024-06-01T00:00:00Z',
            endDate: '2024-08-31T23:59:59Z',
            isActive: true,
            conditions: {
              maxAmount: 20000,
              maxUses: 100,
              maxUsesPerCustomer: 1,
            },
            usage: {
              totalUses: 45,
              totalRevenue: 67500,
              conversionRate: 12.5,
            },
            createdAt: '2024-05-15T10:00:00Z',
          },
          {
            id: '2',
            name: 'First Time Buyer',
            description: '€1,000 off for new customers',
            type: 'FIXED_AMOUNT',
            value: 1000,
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            isActive: true,
            conditions: {
              minAmount: 15000,
              customerSegments: ['NEW'],
              maxUsesPerCustomer: 1,
            },
            usage: {
              totalUses: 23,
              totalRevenue: 23000,
              conversionRate: 8.7,
            },
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '3',
            name: 'Free Parts Shipping',
            description: 'Free shipping on all parts orders',
            type: 'FREE_SHIPPING',
            value: 0,
            startDate: '2024-09-01T00:00:00Z',
            endDate: '2024-09-30T23:59:59Z',
            isActive: false,
            conditions: {
              minAmount: 50,
            },
            usage: {
              totalUses: 156,
              totalRevenue: 2340,
              conversionRate: 22.1,
            },
            createdAt: '2024-08-25T14:30:00Z',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error loading promotions:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const savePromotion = async () => {
    try {
      const method = editingPromotion ? 'PUT' : 'POST';
      const url = editingPromotion
        ? `/api/admin/promotions/${editingPromotion.id}`
        : '/api/admin/promotions';

      const promotionData = {
        ...formData,
        value: parseFloat(formData.value.toString()),
        conditions: {
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
          maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          maxUsesPerCustomer: formData.maxUsesPerCustomer ? parseInt(formData.maxUsesPerCustomer) : undefined,
        },
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData),
      });

      if (response.ok) {
        await loadPromotions();
        resetForm();
      }
    } catch (error) {
      logger.error('Error saving promotion:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const togglePromotionStatus = async (promotionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await loadPromotions();
      }
    } catch (error) {
      logger.error('Error updating promotion status:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deletePromotion = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPromotions();
      }
    } catch (error) {
      logger.error('Error deleting promotion:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const duplicatePromotion = async (promotion: Promotion) => {
    const duplicatedPromotion = {
      ...promotion,
      name: `${promotion.name} (Copy)`,
      id: undefined,
      isActive: false,
    };

    setFormData({
      name: duplicatedPromotion.name,
      description: duplicatedPromotion.description,
      type: duplicatedPromotion.type,
      value: duplicatedPromotion.value,
      startDate: duplicatedPromotion.startDate.split('T')[0],
      endDate: duplicatedPromotion.endDate.split('T')[0],
      minAmount: duplicatedPromotion.conditions.minAmount?.toString() || '',
      maxAmount: duplicatedPromotion.conditions.maxAmount?.toString() || '',
      maxUses: duplicatedPromotion.conditions.maxUses?.toString() || '',
      maxUsesPerCustomer: duplicatedPromotion.conditions.maxUsesPerCustomer?.toString() || '',
    });
    setIsCreating(true);
  };

  const editPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      minAmount: promotion.conditions.minAmount?.toString() || '',
      maxAmount: promotion.conditions.maxAmount?.toString() || '',
      maxUses: promotion.conditions.maxUses?.toString() || '',
      maxUsesPerCustomer: promotion.conditions.maxUsesPerCustomer?.toString() || '',
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      maxUses: '',
      maxUsesPerCustomer: '',
    });
    setIsCreating(false);
    setEditingPromotion(null);
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

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-4 h-4" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="w-4 h-4" />;
      case 'FREE_SHIPPING':
        return <Car className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return promotion.isActive && now >= start && now <= end;
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
          <h2 className="text-2xl font-bold">Promotion Manager</h2>
          <p className="text-gray-600">Create and manage promotional campaigns</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Promotion Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the promotion..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Promotion Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                        <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                        <SelectItem value="BOGO">Buy One Get One</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      placeholder={formData.type === 'PERCENTAGE' ? '15' : '1000'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Conditions</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAmount">Min Amount (€)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Max Amount (€)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUses">Max Total Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxUsesPerCustomer">Max Uses Per Customer</Label>
                    <Input
                      id="maxUsesPerCustomer"
                      type="number"
                      value={formData.maxUsesPerCustomer}
                      onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={savePromotion}>
                <Save className="w-4 h-4 mr-2" />
                {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotions List */}
      <div className="grid grid-cols-1 gap-6">
        {promotions.map((promotion) => (
          <Card key={promotion.id} className={`${isPromotionActive(promotion) ? 'border-green-200 bg-green-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getPromotionTypeIcon(promotion.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{promotion.name}</h3>
                      <p className="text-gray-600">{promotion.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      {isPromotionActive(promotion) && (
                        <Badge variant="default">
                          <Play className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {promotion.isActive && !isPromotionActive(promotion) && (
                        <Badge variant="secondary">
                          <Pause className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                      {!promotion.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Discount</p>
                      <p className="font-semibold">
                        {promotion.type === 'PERCENTAGE' ? `${promotion.value}%` :
                         promotion.type === 'FIXED_AMOUNT' ? formatCurrency(promotion.value) :
                         promotion.type === 'FREE_SHIPPING' ? 'Free Shipping' : 'BOGO'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Period</p>
                      <p className="font-semibold">
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Usage</p>
                      <p className="font-semibold">
                        {promotion.usage.totalUses} uses
                        {promotion.conditions.maxUses && ` / ${promotion.conditions.maxUses}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue Impact</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(promotion.usage.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={promotion.isActive}
                    onCheckedChange={(checked) => togglePromotionStatus(promotion.id, checked)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => editPromotion(promotion)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => duplicatePromotion(promotion)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deletePromotion(promotion.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promotions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No promotions created yet. Create your first promotion to get started.
          </div>
        )}
      </div>
    </div>
  );
}