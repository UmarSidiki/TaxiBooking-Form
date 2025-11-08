"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Palette, CreditCard, MapPin, Mail, Settings as SettingsIcon } from "lucide-react";
import type { ISetting } from "@/models/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { apiGet, apiPost } from "@/utils/api";
import AppearanceTab from "@/components/settings/AppearanceTab";
import BookingTab from "@/components/settings/BookingTab";
import MapTab from "@/components/settings/MapTab";
import PaymentTab from "@/components/settings/PaymentTab";
import SmtpTab from "@/components/settings/SmtpTab";
import FeaturesTab from "@/components/settings/FeaturesTab";

const SettingsPage = () => {
  const [settings, setSettings] = useState<Partial<ISetting>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const t = useTranslations();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const data = await apiGet<{
          success: boolean;
          data: Partial<ISetting>;
        }>("/api/settings");
        if (data.success) {
          const settingsWithDefaults = {
            ...data.data,
            enablePartners: data.data.enablePartners ?? false,
            enableDrivers: data.data.enableDrivers ?? false,
          };
          setSettings(settingsWithDefaults);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        alert(t("Dashboard.Settings.failed-to-load-settings"));
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, [t]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const data = await apiPost<{ success: boolean; message: string }>(
        "/api/settings",
        settings
      );
      if (data.success) {
        window.dispatchEvent(new Event('settingsUpdated'));
        alert(t("Dashboard.Settings.settings-saved-successfully"));
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(t("Dashboard.Settings.failed-to-save-settings"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (
    key: "primaryColor" | "secondaryColor",
    value: string
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBorderRadiusChange = (value: number) => {
    setSettings((prev) => ({ ...prev, borderRadius: value }));
  };

  const handleMapSettingsChange = (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };


  if (isFetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t("Dashboard.Settings.settings")}
        </h1>
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
              {t("Dashboard.Settings.save-all-settings")}{" "}
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 bg-white p-1 rounded-lg shadow-sm h-auto">
          <TabsTrigger
            value="appearance"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Palette className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Settings.appearance")}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="booking"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Settings.booking")}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Settings.map")}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Settings.payment")}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="smtp"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span className="font-medium">
              SMTP
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="font-medium">
              Features
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <AppearanceTab
            settings={settings}
            handleColorChange={handleColorChange}
            handleBorderRadiusChange={handleBorderRadiusChange}
          />
        </TabsContent>
        <TabsContent value="booking">
          <BookingTab
            settings={settings}
            handleMapSettingsChange={handleMapSettingsChange}
          />
        </TabsContent>
        <TabsContent value="map">
          <MapTab
            settings={settings}
            handleMapSettingsChange={handleMapSettingsChange}
          />
        </TabsContent>
        <TabsContent value="payment">
          <PaymentTab
            settings={settings}
            handleMapSettingsChange={handleMapSettingsChange}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </TabsContent>
        <TabsContent value="smtp">
          <SmtpTab
            settings={settings}
            setSettings={setSettings}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesTab
            settings={settings}
            onSettingsChange={handleMapSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
