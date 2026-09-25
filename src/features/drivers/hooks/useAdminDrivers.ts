"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { IDriver } from "@/features/drivers/model";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/http/api";

export type DriverFormValues = Omit<IDriver, "_id" | "createdAt" | "updatedAt"> & {
  _id?: string;
};

export function useAdminDrivers() {
  const t = useTranslations();
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DriverFormValues>({
    name: "",
    email: "",
    password: "",
    isActive: true,
  });

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await apiGet<{ success: boolean; data: IDriver[] }>(
        "/api/drivers"
      );
      if (data.success) setDrivers(data.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setLoadError(t("Driver.failed-to-fetch-drivers"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setFormData({ name: "", email: "", password: "", isActive: true });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const url = editingId ? `/api/drivers/${editingId}` : "/api/drivers";
      const data = editingId
        ? await apiPatch<{ success: boolean; message: string }>(url, formData)
        : await apiPost<{ success: boolean; message: string }>(url, formData);
      if (data.success) {
        setNotice(t("Driver.driver-saved"));
        resetForm();
        fetchDrivers();
      } else {
        setNotice(data.message || t("Driver.operation-failed"));
      }
    } catch (error) {
      console.error("Error saving driver:", error);
      setNotice(t("Driver.failed-to-save-driver"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (driver: IDriver) => {
    setFormData({ ...driver, password: "" });
    setEditingId(driver._id!);
    setShowForm(true);
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
        `/api/drivers/${id}`
      );
      if (data.success) {
        setNotice(t("Driver.driver-deleted"));
        fetchDrivers();
      } else {
        setNotice(data.message || t("Driver.delete-failed"));
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      setNotice(t("Driver.failed-to-delete-driver"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    drivers,
    isLoading,
    showForm,
    setShowForm,
    editingId,
    notice,
    setNotice,
    formData,
    setFormData,
    handleSubmit,
    handleEdit,
    handleDelete,
    pendingDeleteId,
    setPendingDeleteId,
    confirmDelete,
    resetForm,
    openCreateForm,
    loadError,
    fetchDrivers,
  };
}
