"use client";

import { FleetImageSuggestions } from "@/components/fleet/fleet-image-suggestions";
import type { FleetVehicleFormFieldsProps } from "@/components/fleet/fleet-vehicle-form-fields";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export function FleetVehicleFormBasic({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  return (
    <>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">
          {t("Dashboard.Fleet.basic-information")}
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.vehicle-name")}{" "}
        </label>
        <Input
          required
          placeholder={t("Dashboard.Fleet.e-g-mercedes-e-class")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.category2")}
        </label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="economy">
              {t("Dashboard.Fleet.economy")}
            </SelectItem>
            <SelectItem value="comfort">
              {t("Dashboard.Fleet.comfort")}
            </SelectItem>
            <SelectItem value="business">
              {t("Dashboard.Fleet.business")}
            </SelectItem>
            <SelectItem value="van">{t("Dashboard.Fleet.van")}</SelectItem>
            <SelectItem value="luxury">
              {t("Dashboard.Fleet.luxury")}
            </SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.description")}{" "}
        </label>
        <textarea
          required
          placeholder={t("Dashboard.Fleet.describe-the-vehicle-features")}
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background resize-none"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.image-url")}
        </label>
        <Input
          placeholder="Use any Custom Image URL or Select from Suggestions"
          value={formData.image}
          onChange={(e) => {
            setFormData({ ...formData, image: e.target.value });
          }}
        />

        {/* Image suggestions fetched from public folder */}
        <FleetImageSuggestions
          currentValue={formData.image}
          onSelect={(img) => setFormData({ ...formData, image: img })}
        />
      </div>
    </>
  );
}
