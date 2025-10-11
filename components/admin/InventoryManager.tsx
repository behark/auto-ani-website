'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Edit,
  Eye,
  Package,
  AlertTriangle,
  Search,
  Download,
  Trash2,
  Car,
  ImageIcon,
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  status: string;
  featured: boolean;
  images: string[];
  createdAt: string;
}

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  condition: string;
  isActive: boolean;
}

export default function InventoryManager() {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [vehiclesResponse, partsResponse] = await Promise.all([
        fetch('/api/vehicles?limit=50'),
        fetch('/api/parts?limit=50'),
      ]);

      const vehiclesData = await vehiclesResponse.json();
      const partsData = await partsResponse.json();

      if (vehiclesData.success) {
        setVehicles(vehiclesData.vehicles);
      }

      if (partsData.success) {
        setParts(partsData.parts);
      }
    } catch (error) {
      logger.error('Error loading inventory:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/admin/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          items: selectedItems,
        }),
      });

      if (response.ok) {
        await loadInventory();
        setSelectedItems([]);
      }
    } catch (error) {
      logger.error('Bulk action error:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const exportInventory = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`, {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-inventory-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      logger.error('Export error:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.year.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.sku.toLowerCase().includes(searchTerm.toLowerCase());
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
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedItems.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedItems.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('feature')}
              >
                Feature ({selectedItems.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => exportInventory('vehicles')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles" className="flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Vehicles ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Parts ({parts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(filteredVehicles.map(v => v.id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">Vehicle</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Mileage</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(vehicle.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, vehicle.id]);
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== vehicle.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {vehicle.make} {vehicle.model}
                              </div>
                              <div className="text-sm text-gray-600">
                                {vehicle.year} • {vehicle.fuelType}
                              </div>
                              {vehicle.featured && (
                                <Badge variant="secondary" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 font-medium">
                          €{vehicle.price.toLocaleString()}
                        </td>
                        <td className="p-2">
                          {vehicle.mileage.toLocaleString()} km
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              vehicle.status === 'AVAILABLE' ? 'default' :
                              vehicle.status === 'RESERVED' ? 'secondary' : 'destructive'
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVehicles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No vehicles found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle>Parts Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => (
                      <tr key={part.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">{part.sku}</td>
                        <td className="p-2 font-medium">{part.name}</td>
                        <td className="p-2">{part.category}</td>
                        <td className="p-2">€{part.price.toFixed(2)}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <span>{part.stock}</span>
                            {part.stock <= part.lowStockThreshold && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={part.isActive ? 'default' : 'secondary'}>
                            {part.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredParts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No parts found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}