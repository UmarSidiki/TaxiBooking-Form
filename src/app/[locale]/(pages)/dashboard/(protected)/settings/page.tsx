"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Palette, CreditCard, MapPin, Mail } from "lucide-react";
import { ISetting } from "@/models/Setting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { apiGet, apiPost } from "@/utils/api";
import AppearanceTab from "@/components/settings/AppearanceTab";
import BookingTab from "@/components/settings/BookingTab";
import MapTab from "@/components/settings/MapTab";
import PaymentTab from "@/components/settings/PaymentTab";
import SmtpTab from "@/components/settings/SmtpTab";

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
          setSettings(data.data);
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
        alert(t("Dashboard.Settings.settings-saved-successfully"));
        // Optional: trigger a global state update or page reload to apply changes
        window.location.reload();
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
    <div className="w-full p-4 md:p-6">
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            {t("Dashboard.Settings.appearance")}{" "}
          </TabsTrigger>
          <TabsTrigger value="booking">
            <CreditCard className="mr-2 h-4 w-4" />
            {t("Dashboard.Settings.booking")}{" "}
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="mr-2 h-4 w-4" />
            {t("Dashboard.Settings.map")}{" "}
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            {t("Dashboard.Settings.payment")}{" "}
          </TabsTrigger>
          <TabsTrigger value="smtp">
            <Mail className="mr-2 h-4 w-4" />
            SMTP{" "}
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
      </Tabs>
    </div>
  );
};

export default SettingsPage;
