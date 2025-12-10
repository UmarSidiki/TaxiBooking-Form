"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { IDriver } from "@/models/driver";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/utils/api";
import { useTranslations } from "next-intl";

interface DriverForm extends Omit<IDriver, "_id" | "createdAt" | "updatedAt"> {
  _id?: string;
}

const DriversPage = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DriverForm>({
    name: "",
    email: "",
    password: "",
    isActive: true,
  });
  const t = useTranslations();

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{ success: boolean; data: IDriver[] }>(
        "/api/drivers"
      );
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      alert(t("Driver.failed-to-fetch-drivers"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/drivers/${editingId}` : "/api/drivers";

      const data = editingId
        ? await apiPatch<{ success: boolean; message: string }>(url, formData)
        : await apiPost<{ success: boolean; message: string }>(url, formData);

      if (data.success) {
        alert(data.message);
        resetForm();
        fetchDrivers();
      } else {
        alert(data.message || t("Driver.operation-failed"));
      }
    } catch (error) {
      console.error("Error saving driver:", error);
      alert(t("Driver.failed-to-save-driver"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (driver: IDriver) => {
    setFormData({
      ...driver,
      password: "", // Don't show password
    });
    setEditingId(driver._id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Driver.are-you-sure-you-want-to-delete-this-driver"))) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiDelete<{ success: boolean; message: string }>(
        `/api/drivers/${id}`
      );

      if (data.success) {
        alert(data.message);
        fetchDrivers();
      } else {
        alert(data.message || t("Driver.delete-failed"));
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert(t("Driver.failed-to-delete-driver"));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {t("Driver.driver-management")}{" "}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t("Driver.manage-your-drivers-and-their-accounts")}{" "}
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Driver.add-driver")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? t("Driver.edit-driver")
                  : t("Driver.add-new-driver")}
              </DialogTitle>
            </DialogHeader>
            <DriverForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isLoading={isLoading}
              editingId={editingId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {drivers.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-dashed border-border bg-card">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Users className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t("Driver.no-drivers-yet")}{" "}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                    {t("Driver.get-started-by-adding-your-first-driver")}{" "}
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("Driver.add-your-first-driver")}{" "}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            drivers.map((driver) => (
              <DriverCard
                key={driver._id}
                driver={driver}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Driver Card Component
const DriverCard = ({
  driver,
  onEdit,
  onDelete,
}: {
  driver: IDriver;
  onEdit: (driver: IDriver) => void;
  onDelete: (id: string) => void;
}) => {

  const t = useTranslations();
  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 bg-card min-w-[300px] ${
        !driver.isActive ? "opacity-60" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate text-foreground">
              {driver.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {driver.email}
            </p>
          </div>
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(driver)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(driver._id!)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Separator className="bg-border" />

        <div className="flex justify-between items-center">
          <Badge
            variant={driver.isActive ? "default" : "secondary"}
            className={
              driver.isActive
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            }
          >
            {driver.isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("Driver.active")}{" "}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                {t("Driver.inactive")}{" "}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Driver Form Component
const DriverForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: {
  formData: DriverForm;
  setFormData: (data: DriverForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}) => {
  const t = useTranslations();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Driver.name")}
        </label>
        <Input
          required
          placeholder={t("Driver.driver-name")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Driver.email")}
        </label>
        <Input
          required
          type="email"
          placeholder="driver@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Driver.password")}
        </label>
        <Input
          required={!editingId}
          type="password"
          placeholder={t("Driver.password")}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        {editingId && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("Driver.leave-empty-to-keep-current-password")}{" "}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          {t("Driver.active")}{" "}
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {editingId ? t("Driver.update-driver") : t("Driver.add-driver")}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Driver.cancel")}{" "}
        </Button>
      </div>
    </form>
  );
};

export default DriversPage;
