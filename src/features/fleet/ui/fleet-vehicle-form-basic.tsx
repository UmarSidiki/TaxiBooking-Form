"use client";

import { FleetImageSuggestions } from "@/features/fleet/ui/fleet-image-suggestions";
import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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
        <label htmlFor="vehicle-name" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.vehicle-name")}{" "}
        </label>
        <Input
          id="vehicle-name"
          name="vehicle-name"
          required
          placeholder={t("Dashboard.Fleet.e-g-mercedes-e-class")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="vehicle-category" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.category2")}
        </label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger id="vehicle-category">
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
        <label htmlFor="vehicle-description" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.description")}{" "}
        </label>
        <textarea
          id="vehicle-description"
          name="vehicle-description"
          required
          placeholder={t("Dashboard.Fleet.describe-the-vehicle-features")}
          className="min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="vehicle-image" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.image-url")}
        </label>
        <Input
          id="vehicle-image"
          name="vehicle-image"
          autoComplete="off"
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
