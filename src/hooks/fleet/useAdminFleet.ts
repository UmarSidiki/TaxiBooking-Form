"use client";

import type { VehicleForm } from "@/components/fleet/vehicle-form.types";
import {
  DEFAULT_BABY_SEAT_PRICE,
  DEFAULT_CHILD_SEAT_PRICE,
  DEFAULT_VEHICLE_MINIMUM_HOURS,
  DEFAULT_VEHICLE_PRICE_PER_HOUR,
  DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
  INITIAL_VEHICLE_FORM,
  RESET_VEHICLE_FORM,
} from "@/lib/fleet/vehicle-form-defaults";
import { resolveVehicleImageSrc } from "@/lib/fleet/resolve-vehicle-image-src";
import type { IVehicle } from "@/models/vehicle";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

export function useAdminFleet() {
  const t = useTranslations();
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState<VehicleForm>(INITIAL_VEHICLE_FORM);

  const resolveImageSrc = resolveVehicleImageSrc;

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{ success: boolean; data: IVehicle[] }>(
        "/api/vehicles"
      );
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      alert(t("Dashboard.Fleet.failed-to-fetch-vehicles"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const resetForm = () => {
    setFormData({ ...RESET_VEHICLE_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";

      const data = editingId
        ? await apiPatch<{ success: boolean; message: string }>(url, formData)
        : await apiPost<{ success: boolean; message: string }>(url, formData);

      if (data.success) {
        alert(data.message);
        resetForm();
        fetchVehicles();
      } else {
        alert(data.message || t("Dashboard.Fleet.operation-failed"));
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert(t("Dashboard.Fleet.failed-to-save-vehicle"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle: IVehicle) => {
    setFormData({
      ...vehicle,
      childSeatPrice: vehicle.childSeatPrice || DEFAULT_CHILD_SEAT_PRICE,
      babySeatPrice: vehicle.babySeatPrice || DEFAULT_BABY_SEAT_PRICE,
      pricePerHour: vehicle.pricePerHour || DEFAULT_VEHICLE_PRICE_PER_HOUR,
      minimumHours: vehicle.minimumHours || DEFAULT_VEHICLE_MINIMUM_HOURS,
      returnPricePercentage:
        vehicle.returnPricePercentage === undefined
          ? DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE
          : vehicle.returnPricePercentage,
      discount: vehicle.discount === undefined ? 0 : vehicle.discount,
      stopPrice: vehicle.stopPrice || 0,
      stopPricePerHour: vehicle.stopPricePerHour || 0,
    });
    setEditingId(vehicle._id!);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top to show form
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        t("Dashboard.Fleet.are-you-sure-you-want-to-delete-this-vehicle")
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiDelete<{ success: boolean; message: string }>(
        `/api/vehicles/${id}`
      );

      if (data.success) {
        alert(data.message);
        fetchVehicles();
      } else {
        alert(data.message || t("Dashboard.Fleet.delete-failed"));
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert(t("Dashboard.Fleet.failed-to-delete-vehicle"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || vehicle.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && vehicle.isActive) ||
        (statusFilter === "inactive" && !vehicle.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vehicles, searchQuery, categoryFilter, statusFilter]);

  return {
    t,
    vehicles,
    isLoading,
    showForm,
    setShowForm,
    editingId,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    formData,
    setFormData,
    resolveImageSrc,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
    filteredVehicles,
  };
}
