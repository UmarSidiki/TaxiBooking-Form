import type { VehicleForm } from "@/features/fleet/ui/vehicle-form.types";

export type FleetVehicleFormFieldsProps = {
  formData: VehicleForm;
  setFormData: (data: VehicleForm) => void;
};
