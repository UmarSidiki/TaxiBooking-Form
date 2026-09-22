"use client";

import type { VehicleForm } from "@/features/fleet/ui/vehicle-form.types";
import {
  DEFAULT_BABY_SEAT_PRICE,
  DEFAULT_CHILD_SEAT_PRICE,
  DEFAULT_VEHICLE_MINIMUM_HOURS,
  DEFAULT_VEHICLE_PRICE_PER_HOUR,
  DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
  INITIAL_VEHICLE_FORM,
  RESET_VEHICLE_FORM,
} from "@/features/fleet/lib/vehicle-form-defaults";
import { resolveVehicleImageSrc } from "@/features/fleet/lib/resolve-vehicle-image-src";
import type { IVehicle } from "@/features/fleet/model";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/http/api";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

export function useAdminFleet() {
  const t = useTranslations();
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState<VehicleForm>(INITIAL_VEHICLE_FORM);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolveImageSrc = resolveVehicleImageSrc;

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await apiGet<{ success: boolean; data: IVehicle[] }>(
        "/api/vehicles"
      );
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setLoadError(t("Dashboard.Fleet.failed-to-fetch-vehicles"));
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
        setNotice(t("Dashboard.Fleet.vehicle_saved"));
        resetForm();
        fetchVehicles();
      } else {
        setNotice(t("Dashboard.Fleet.operation-failed"));
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
      setNotice(t("Dashboard.Fleet.failed-to-save-vehicle"));
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

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      setIsLoading(true);
      const data = await apiDelete<{ success: boolean; message: string }>(
        `/api/vehicles/${id}`
      );

      if (data.success) {
        setNotice(t("Dashboard.Fleet.vehicle_deleted"));
        fetchVehicles();
      } else {
        setNotice(t("Dashboard.Fleet.delete-failed"));
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setNotice(t("Dashboard.Fleet.failed-to-delete-vehicle"));
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
    pendingDeleteId,
    setPendingDeleteId,
    confirmDelete,
    resetForm,
    filteredVehicles,
    notice,
    setNotice,
    loadError,
    fetchVehicles,
  };
}
