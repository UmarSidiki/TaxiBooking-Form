"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { IVehicle } from '@/models/Vehicle';
import Image from 'next/image';

interface VehicleForm {
  _id?: string;
  name: string;
  description: string;
  image: string;
  persons: number;
  baggages: number;
  price: number;
  pricePerKm: number;
  minimumFare: number;
  category: string;
  childSeatPrice: number;
  babySeatPrice: number;
  isActive: boolean;
}

const FleetPage = () => {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleForm>({
    name: '',
    description: '',
    image: '/placeholder-car.jpg',
    persons: 4,
    baggages: 2,
    price: 0,
    pricePerKm: 2,
    minimumFare: 20,
    category: 'economy',
    childSeatPrice: 10,
    babySeatPrice: 10,
    isActive: true,
  });

  const resolveImageSrc = (src: string) => {
    if (!src) {
      return '/placeholder-car.jpg';
    }

    if (src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }

    try {
      const url = new URL(src);
      return url.toString();
    } catch (error) {
      console.warn('Invalid vehicle image URL detected. Falling back to placeholder.', error);
      return '/placeholder-car.jpg';
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        resetForm();
        fetchVehicles();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle: IVehicle) => {
    setFormData({
      name: vehicle.name,
      description: vehicle.description,
      image: vehicle.image,
      persons: vehicle.persons,
      baggages: vehicle.baggages,
      price: vehicle.price,
      pricePerKm: vehicle.pricePerKm,
      minimumFare: vehicle.minimumFare,
      category: vehicle.category,
      childSeatPrice: vehicle.childSeatPrice || 10,
      babySeatPrice: vehicle.babySeatPrice || 10,
      isActive: vehicle.isActive,
    });
    setEditingId(vehicle._id!);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to show form
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchVehicles();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '/placeholder-car.jpg',
      persons: 4,
      baggages: 2,
      price: 0,
      pricePerKm: 2,
      minimumFare: 20,
      category: 'economy',
      childSeatPrice: 10,
      babySeatPrice: 10,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    // RESPONSIVE CHANGE: Reduced padding on small screens (p-4) and increased on medium and up (md:p-6)
    <div className="container mx-auto p-4 md:p-6">
      {/* RESPONSIVE CHANGE: Stack header vertically on small screens (flex-col) and horizontally on larger screens (sm:flex-row) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* RESPONSIVE CHANGE: Reduced font size on small screens (text-2xl) and increased on larger (sm:text-3xl) */}
        <h1 className="text-2xl sm:text-3xl font-bold">Fleet Management</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          {showForm ? (
            <>
              {/* RESPONSIVE CHANGE: Hide button text on small screens for a compact look */}
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Vehicle</span>
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NOTE: This grid is already responsive. It's 1 column on mobile and 2 on medium screens. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle Name *</label>
                  <Input
                    required
                    placeholder="e.g., Mercedes E-Class"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="economy">Economy</option>
                    <option value="comfort">Comfort</option>
                    <option value="business">Business</option>
                    <option value="van">Van</option>
                    <option value="luxury">Luxury</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    required
                    placeholder="Describe the vehicle features..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <Input
                    placeholder="/images/car.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Base Price (€) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                   <p className="text-xs text-gray-500 mt-1">Starting fare before distance calculation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price per KM (€) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2"
                    value={formData.pricePerKm}
                    onChange={(e) => setFormData({ ...formData, pricePerKm: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Rate charged per kilometer</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Fare (€) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="20"
                    value={formData.minimumFare}
                    onChange={(e) => setFormData({ ...formData, minimumFare: parseFloat(e.target.value) || 0 })}
                  />
                   <p className="text-xs text-gray-500 mt-1">Minimum charge for any trip</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Persons Capacity *</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    max="50"
                    placeholder="4"
                    value={formData.persons}
                    onChange={(e) => setFormData({ ...formData, persons: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Baggages Capacity *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    max="20"
                    placeholder="2"
                    value={formData.baggages}
                    onChange={(e) => setFormData({ ...formData, baggages: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Child Seat Price (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10"
                    value={formData.childSeatPrice}
                    onChange={(e) => setFormData({ ...formData, childSeatPrice: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Price per child seat</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Baby Seat Price (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10"
                    value={formData.babySeatPrice}
                    onChange={(e) => setFormData({ ...formData, babySeatPrice: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Price per baby seat</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active (Available for booking)
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingId ? 'Update Vehicle' : 'Add Vehicle'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && !showForm ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      ) : (
        // NOTE: This grid is also already responsive. It's 1 column on mobile, 2 on medium, and 3 on large screens.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No vehicles found. Add your first vehicle to get started!
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <Card key={vehicle._id} className={!vehicle.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  {/* RESPONSIVE CHANGE: Added gap to prevent title and buttons from touching on wrap */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">{vehicle.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(vehicle._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vehicle.image && (
                      <div className="relative w-full h-40 bg-gray-200 rounded-md overflow-hidden">
                        {/* BEST PRACTICE: Added width and height props to prevent layout shift */}
                        <Image
                          src={resolveImageSrc(vehicle.image)}
                          alt={vehicle.name}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{vehicle.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium">👥 Persons:</span>
                        <span className="ml-2">{vehicle.persons}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">🧳 Baggages:</span>
                        <span className="ml-2">{vehicle.baggages}</span>
                      </div>
                    </div>
                    {/* RESPONSIVE CHANGE: Added flex-wrap and gap to allow price and status to stack if needed */}
                    <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t">
                      <span className="text-2xl font-bold text-yellow-600">€{vehicle.price}</span>
                      <span className={`text-sm px-2 py-1 rounded ${vehicle.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {vehicle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FleetPage;