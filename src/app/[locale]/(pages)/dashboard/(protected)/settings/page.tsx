"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Palette, Square, Circle, MapPin } from 'lucide-react';
import { ISetting } from '@/models/Setting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsPage = () => {
  const [settings, setSettings] = useState<Partial<ISetting>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        alert('Failed to load settings.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
        // Optional: trigger a global state update or page reload to apply changes
        window.location.reload();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (key: 'primaryColor' | 'secondaryColor', value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleBorderRadiusChange = (value: number) => {
    setSettings(prev => ({ ...prev, borderRadius: value }));
  };

  const handleMapSettingsChange = (key: keyof ISetting, value: string | number | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="mr-2 h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Scheme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={settings.primaryColor || '#EAB308'}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      />
                      <Input
                        placeholder="#EAB308"
                        value={settings.primaryColor || ''}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for buttons, highlights, and main actions.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={settings.secondaryColor || '#111827'}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      />
                      <Input
                        placeholder="#111827"
                        value={settings.secondaryColor || ''}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for text, backgrounds, and secondary elements.</p>
                  </div>
                </div>
              </div>

              {/* Border Radius Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Border Radius</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Corner Sharpness</label>
                  <div className="flex items-center gap-4">
                    <Square className="h-5 w-5" />
                    <Input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.25"
                      value={settings.borderRadius ?? 0.5}
                      onChange={(e) => handleBorderRadiusChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <Circle className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Controls the roundness of buttons, inputs, and cards.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Map Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Map Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Initial Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="46.2044"
                      value={settings.mapInitialLat ?? ''}
                      onChange={(e) => handleMapSettingsChange('mapInitialLat', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default latitude for the map center.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="6.1432"
                      value={settings.mapInitialLng ?? ''}
                      onChange={(e) => handleMapSettingsChange('mapInitialLng', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default longitude for the map center.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Restrictions</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Country Restrictions</label>
                  <Input
                    placeholder="CH, FR, DE (2-letter country codes, comma-separated)"
                    value={settings.mapCountryRestrictions?.join(', ') ?? ''}
                    onChange={(e) => handleMapSettingsChange('mapCountryRestrictions', e.target.value.split(',').map(c => c.trim().toUpperCase()))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Limit address autocomplete to specific countries. Leave empty for no restrictions.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

