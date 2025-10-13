"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Palette, Square, Circle, MapPin, CreditCard, Banknote, Building2 } from 'lucide-react';
import { ISetting } from '@/models/Setting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from 'next-intl';

const SettingsPage = () => {
  const [settings, setSettings] = useState<Partial<ISetting>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const t = useTranslations();

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
        alert(t('Dashboard.Settings.failed-to-load-settings'));
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  },[]);

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
        alert(t('Dashboard.Settings.settings-saved-successfully'));
        // Optional: trigger a global state update or page reload to apply changes
        window.location.reload();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('Dashboard.Settings.failed-to-save-settings'));
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
    { 
      id: 'card', 
      label: t('Dashboard.Settings.stripe-payment'), 
      Icon: CreditCard,
      description: t('Dashboard.Settings.cards-paypal-apple-pay-google-pay-and-more')
    },
    { 
      id: 'cash', 
      label: t('Dashboard.Settings.cash-payment'), 
      Icon: Banknote,
      description: t('Dashboard.Settings.pay-with-cash-on-delivery')
    },
    { 
      id: 'bank_transfer', 
      label: t('Dashboard.Settings.bank-transfer'), 
      Icon: Building2,
      description: t('Dashboard.Settings.direct-bank-transfer')
    },
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
        <h1 className="text-2xl sm:text-3xl font-bold">{t('Dashboard.Settings.settings')}</h1>
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
              {t('Dashboard.Settings.save-all-settings')} </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            {t('Dashboard.Settings.appearance')} </TabsTrigger>
          <TabsTrigger value="booking">
            <CreditCard className="mr-2 h-4 w-4" />
            {t('Dashboard.Settings.booking')} </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="mr-2 h-4 w-4" />
            {t('Dashboard.Settings.map')} </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            {t('Dashboard.Settings.payment')} </TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('Dashboard.Settings.theme-and-appearance')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.color-scheme')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.primary-color')}</label>
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
                    <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.used-for-buttons-highlights-and-main-actions')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.secondary-color')}</label>
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
                    <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.used-for-text-backgrounds-and-secondary-elements')}</p>
                  </div>
                </div>
              </div>

              {/* Border Radius Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.border-radius')}</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.corner-sharpness')}</label>
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
                  <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.controls-the-roundness-of-buttons-inputs-and-cards')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle>{t('Dashboard.Settings.booking-settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Redirect URL Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.post-booking-redirect')}</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.redirect-url')}</label>
                  <Input
                    type="url"
                    placeholder={t('Dashboard.Settings.https-yourwebsite-com-or-leave-empty-for-home-page')}
                    value={settings.redirectUrl || ''}
                    onChange={(e) => handleMapSettingsChange('redirectUrl', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {t('Dashboard.Settings.after-a-successful-booking-customers-will-be-redirected-to-this-url-after-3-seconds')} <br />
                    {t('Dashboard.Settings.leave-empty-to-redirect-to-the-home-page')} </p>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>{t('Dashboard.Settings.tip')}</strong> {t('Dashboard.Settings.you-can-redirect-to')}
                      <br />{t('Dashboard.Settings.your-main-website-homepage')}
                      <br />{t('Dashboard.Settings.a-custom-thank-you-page-on-your-site')}
                      <br />{t('Dashboard.Settings.a-special-offers-page')}
                      <br />{t('Dashboard.Settings.or-any-other-url-you-choose')}
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
              <CardTitle>{t('Dashboard.Settings.map-configuration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Map Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.initial-location')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.initial-latitude')}</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="46.2044"
                      value={settings.mapInitialLat ?? ''}
                      onChange={(e) => handleMapSettingsChange('mapInitialLat', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.default-latitude-for-the-map-center')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.initial-longitude')}</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="6.1432"
                      value={settings.mapInitialLng ?? ''}
                      onChange={(e) => handleMapSettingsChange('mapInitialLng', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.default-longitude-for-the-map-center')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.restrictions')}</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.country-restrictions')}</label>
                  <Input
                    placeholder={t('Dashboard.Settings.ch-fr-de-2-letter-country-codes-comma-separated')}
                    value={settings.mapCountryRestrictions?.join(', ') ?? ''}
                    onChange={(e) => handleMapSettingsChange('mapCountryRestrictions', e.target.value.split('Dashboard.Settings.,').map(c => c.trim().toUpperCase()))}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.limit-address-autocomplete-to-specific-countries-leave-empty-for-no-restrictions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>{t('Dashboard.Settings.payment-configuration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe API Keys */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('Dashboard.Settings.stripe-configuration')}</h3>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.stripeTestMode ?? true}
                        onChange={(e) => handleMapSettingsChange('stripeTestMode', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className={settings.stripeTestMode ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                        {settings.stripeTestMode ? t('Dashboard.Settings.test-mode') : t('Dashboard.Settings.live-mode')}
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.publishable-key')}</label>
                    <Input
                      type="text"
                      placeholder={settings.stripeTestMode ? "pk_test_..." : "pk_live_..."}
                      value={settings.stripePublishableKey ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripePublishableKey', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Dashboard.Settings.your-stripe')} {settings.stripeTestMode ? 'test' : 'live'} {t('Dashboard.Settings.publishable-key-starts-with-pk_')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.secret-key')}</label>
                    <Input
                      type="password"
                      placeholder={settings.stripeTestMode ? "sk_test_..." : "sk_live_..."}
                      value={settings.stripeSecretKey ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeSecretKey', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Dashboard.Settings.your-stripe-0')} {settings.stripeTestMode ? 'test' : 'live'} {t('Dashboard.Settings.secret-key-starts-with-sk_-keep-this-secure')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.webhook-secret-optional')}</label>
                    <Input
                      type="password"
                      placeholder="whsec_..."
                      value={settings.stripeWebhookSecret ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeWebhookSecret', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Dashboard.Settings.webhook-signing-secret-for-secure-payment-status-updates')} </p>
                  </div>
                </div>
              </div>

              {/* Stripe Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.payment-settings')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.currency')}</label>
                    <select
                      value={settings.stripeCurrency ?? 'eur'}
                      onChange={(e) => handleMapSettingsChange('stripeCurrency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="eur">{t('Dashboard.Settings.eur-eur-euro')}</option>
                      <option value="usd">{t('Dashboard.Settings.usd-us-dollar')}</option>
                      <option value="gbp">{t('Dashboard.Settings.gbp-gbp-british-pound')}</option>
                      <option value="chf">{t('Dashboard.Settings.chf-fr-swiss-franc')}</option>
                      <option value="jpy">{t('Dashboard.Settings.jpy-cny-japanese-yen')}</option>
                      <option value="cad">{t('Dashboard.Settings.cad-canadian-dollar')}</option>
                      <option value="aud">{t('Dashboard.Settings.aud-australian-dollar')}</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">{t('Dashboard.Settings.default-currency-for-payments')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.statement-descriptor-suffix')}</label>
                    <Input
                      type="text"
                      placeholder="BOOKING"
                      maxLength={22}
                      value={settings.stripeStatementDescriptor ?? ''}
                      onChange={(e) => handleMapSettingsChange('stripeStatementDescriptor', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Dashboard.Settings.suffix-shown-on-customer-and-apos-s-statement-e-g-and-quot-company-booking-and-quot-max-22-chars')} </p>
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
                      <p className="text-sm font-medium">{t('Dashboard.Settings.allow-customers-to-save-cards')}</p>
                      <p className="text-xs text-gray-500">{t('Dashboard.Settings.customers-can-save-cards-for-future-bookings')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('Dashboard.Settings.accepted-payment-methods')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        settings.acceptedPaymentMethods?.includes(method.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      } ${method.id === 'card' && !settings.stripePublishableKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.acceptedPaymentMethods?.includes(method.id) ?? false}
                        onChange={(e) => {
                          if (method.id === 'card' && !settings.stripePublishableKey) {
                            alert(t('Dashboard.Settings.please-configure-stripe-settings-first-before-enabling-card-payments'));
                            return;
                          }
                          const current = settings.acceptedPaymentMethods || [];
                          const updated = e.target.checked
                            ? [...current, method.id]
                            : current.filter((m) => m !== method.id);
                          handleMapSettingsChange('acceptedPaymentMethods', updated);
                        }}
                        disabled={method.id === 'card' && !settings.stripePublishableKey}
                        className="w-4 h-4 mt-0.5"
                      />
                      <method.Icon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{method.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  {!settings.stripePublishableKey && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        ⚠️ <strong>{t('Dashboard.Settings.configure-stripe-first')}</strong> {t('Dashboard.Settings.add-your-stripe-api-keys-above-to-enable-card-payments')}
                      </p>
                    </div>
                  )}
                  {settings.stripePublishableKey && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>{t('Dashboard.Settings.stripe-payment-includes')}</strong>
                        <br />{t('Dashboard.Settings.credit-debit-cards-visa-mastercard-amex-etc')}
                        <br />{t('Dashboard.Settings.paypal-if-enabled-in-your-stripe-account')}
                        <br />{t('Dashboard.Settings.apple-pay-and-google-pay-shown-automatically-on-supported-devices')}
                        <br />{t('Dashboard.Settings.buy-now-pay-later-options-klarna-affirm-afterpay-based-on-region')}
                        <br />{t('Dashboard.Settings.cash-app-link-and-more-payment-methods')}
                        <br /><br />
                        <em>{t('Dashboard.Settings.available-methods-depend-on-your-stripe-account-settings-and-customer-location')}</em>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Account Details */}
              {settings.acceptedPaymentMethods?.includes('bank_transfer') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t('Dashboard.Settings.bank-account-details')} </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    {t('Dashboard.Settings.these-details-will-be-shown-to-customers-who-choose-bank-transfer-payment')} </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.bank-name')}</label>
                      <Input
                        type="text"
                        placeholder={t('Dashboard.Settings.ubs-switzerland-ag')}
                        value={settings.bankName ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.account-name')}</label>
                      <Input
                        type="text"
                        placeholder={t('Dashboard.Settings.company-name')}
                        value={settings.bankAccountName ?? ''}
                        onChange={(e) => handleMapSettingsChange('bankAccountName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('Dashboard.Settings.account-number')}</label>
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
                        placeholder={t('Dashboard.Settings.ch93-0076-2011-6238-5295-7')}
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
                  <strong>Note:</strong> {t('Dashboard.Settings.to-use-stripe-payments-you-need-to-create-a-stripe-account-at')}{' '}
                  <a href="https://stripe.com" target="_blank" rel={t('Dashboard.Settings.noopener-noreferrer')} className="underline">
                    stripe.com
                  </a>
                  {' '}{t('Dashboard.Settings.and-get-your-api-keys-from-the-dashboard')}
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

