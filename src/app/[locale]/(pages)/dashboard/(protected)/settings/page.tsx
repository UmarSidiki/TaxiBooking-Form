"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Palette, Square, Circle, MapPin, CreditCard, Banknote, Building2, Wallet } from 'lucide-react';
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

  const handleMapSettingsChange = (key: keyof ISetting, value: string | number | string[] | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const paymentMethods = [
    { id: 'card', label: 'Stripe Payment', Icon: CreditCard },
    ...(settings.stripePublishableKey ? [
      { id: 'paypal', label: 'PayPal', Icon: Wallet },
      { id: 'apple_pay', label: 'Apple Pay', Icon: CreditCard },
      { id: 'google_pay', label: 'Google Pay', Icon: CreditCard },
    ] : []),
    { id: 'cash', label: 'Cash Payment', Icon: Banknote },
    { id: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
  ];

  if (isFetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="booking">
            <CreditCard className="mr-2 h-4 w-4" />
            Booking
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="mr-2 h-4 w-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment
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
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Redirect URL Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Post-Booking Redirect</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Redirect URL</label>
                  <Input
                    type="url"
                    placeholder="https://yourwebsite.com or leave empty for home page"
                    value={settings.redirectUrl || ''}
                    onChange={(e) => handleMapSettingsChange('redirectUrl', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    After a successful booking, customers will be redirected to this URL after 3 seconds.
                    <br />
                    Leave empty to redirect to the home page (/).
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Tip:</strong> You can redirect to:
                      <br />• Your main website homepage
                      <br />• A custom thank you page on your site
                      <br />• A special offers page
                      <br />• Or any other URL you choose
                    </p>
                  </div>
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
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe API Keys */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Stripe Configuration</h3>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.stripeTestMode ?? true}
                        onChange={(e) => handleMapSettingsChange('stripeTestMode', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className={settings.stripeTestMode ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                        {settings.stripeTestMode ? '🧪 Test Mode' : '🔴 Live Mode'}
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Publishable Key</label>
                    <Input
                      type="text"
                      placeholder={settings.stripeTestMode ? "pk_test_..." : "pk_live_..."}
                      value={settings.stripePublishableKey ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripePublishableKey', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your Stripe {settings.stripeTestMode ? 'test' : 'live'} publishable key (starts with pk_)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secret Key</label>
                    <Input
                      type="password"
                      placeholder={settings.stripeTestMode ? "sk_test_..." : "sk_live_..."}
                      value={settings.stripeSecretKey ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeSecretKey', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your Stripe {settings.stripeTestMode ? 'test' : 'live'} secret key (starts with sk_) - Keep this secure!
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Webhook Secret (Optional)</label>
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      value={settings.stripeWebhookSecret ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeWebhookSecret', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Webhook signing secret for secure payment status updates
                    </p>
                  </div>
                </div>
              </div>

              {/* Stripe Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Payment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={settings.stripeCurrency ?? 'eur'}
                      onChange={(e) => handleMapSettingsChange('stripeCurrency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="eur">EUR (€) - Euro</option>
                      <option value="usd">USD ($) - US Dollar</option>
                      <option value="gbp">GBP (£) - British Pound</option>
                      <option value="chf">CHF (Fr) - Swiss Franc</option>
                      <option value="jpy">JPY (¥) - Japanese Yen</option>
                      <option value="cad">CAD ($) - Canadian Dollar</option>
                      <option value="aud">AUD ($) - Australian Dollar</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Default currency for payments</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Statement Descriptor Suffix</label>
                    <Input
                      type="text"
                      placeholder="BOOKING"
                      maxLength={22}
                      value={settings.stripeStatementDescriptor ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeStatementDescriptor', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Suffix shown on customer&apos;s statement (e.g., &quot;COMPANY* BOOKING&quot;) - max 22 chars
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.stripeSaveCards ?? false}
                      onChange={(e) => handleMapSettingsChange('stripeSaveCards', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium">Allow customers to save cards</p>
                      <p className="text-xs text-gray-500">Customers can save cards for future bookings</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.stripeAutomaticTax ?? false}
                      onChange={(e) => handleMapSettingsChange('stripeAutomaticTax', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium">Enable Stripe Tax (Automatic Tax Calculation)</p>
                      <p className="text-xs text-gray-500">Automatically calculate and collect sales tax</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Accepted Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={settings.acceptedPaymentMethods?.includes(method.id) ?? false}
                        onChange={(e) => {
                          const current = settings.acceptedPaymentMethods || [];
                          const updated = e.target.checked
                            ? [...current, method.id]
                            : current.filter((m) => m !== method.id);
                          handleMapSettingsChange('acceptedPaymentMethods', updated);
                        }}
                        className="w-4 h-4"
                      />
                      <method.Icon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Select which payment methods customers can use. Card payments require Stripe configuration.
                </p>
              </div>

              {/* Bank Account Details */}
              {settings.acceptedPaymentMethods?.includes('bank_transfer') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Bank Account Details
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    These details will be shown to customers who choose bank transfer payment
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bank Name</label>
                      <Input
                        type="text"
                        placeholder="UBS Switzerland AG"
                        value={settings.bankName ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Name</label>
                      <Input
                        type="text"
                        placeholder="Company Name"
                        value={settings.bankAccountName ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankAccountName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Number</label>
                      <Input
                        type="text"
                        placeholder="123456789"
                        value={settings.bankAccountNumber ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankAccountNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">IBAN</label>
                      <Input
                        type="text"
                        placeholder="CH93 0076 2011 6238 5295 7"
                        value={settings.bankIBAN ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankIBAN', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SWIFT/BIC</label>
                      <Input
                        type="text"
                        placeholder="UBSWCHZH80A"
                        value={settings.bankSwiftBIC ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankSwiftBIC', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To use Stripe payments, you need to create a Stripe account at{' '}
                  <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">
                    stripe.com
                  </a>
                  {' '}and get your API keys from the dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

