import type { VehicleForm } from "@/components/fleet/vehicle-form.types";

export type FleetVehicleFormFieldsProps = {
  formData: VehicleForm;
  setFormData: (data: VehicleForm) => void;
};
