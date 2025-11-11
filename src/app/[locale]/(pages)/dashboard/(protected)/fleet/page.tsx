"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Car,
  Users,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { IVehicle } from "@/models/vehicle";
import Image from "next/image";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/utils/api";
import { useCurrency } from "@/contexts/CurrencyContext";

interface VehicleForm
  extends Omit<IVehicle, "_id" | "createdAt" | "updatedAt"> {
  _id?: string;
}

const FleetPage = () => {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState<VehicleForm>({
    name: "",
    description: "",
    image: "",
    persons: 4,
    baggages: 2,
    price: 0,
    pricePerKm: 2,
    pricePerHour: 30,
    minimumFare: 20,
    minimumHours: 2,
    returnPricePercentage: 100,
    discount: 0,
    category: "economy",
    childSeatPrice: 10,
    babySeatPrice: 10,
    stopPrice: 0,
    stopPricePerHour: 0,
    isActive: true,
  });

  const t = useTranslations();

  const resolveImageSrc = (src: string) => {
    if (!src) {
      return "/placeholder-car.jpg";
    }

    if (src.startsWith("/") || src.startsWith("data:")) {
      return src;
    }

    try {
      const url = new URL(src);
      return url.toString();
    } catch (error) {
      console.warn(
        "Invalid vehicle image URL detected. Falling back to placeholder.",
        error
      );
      return "/placeholder-car.jpg";
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      childSeatPrice: vehicle.childSeatPrice || 10,
      babySeatPrice: vehicle.babySeatPrice || 10,
      pricePerHour: vehicle.pricePerHour || 30,
      minimumHours: vehicle.minimumHours || 2,
      returnPricePercentage:
        vehicle.returnPricePercentage === undefined
          ? 100
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "/placeholder-car.jpg",
      persons: 4,
      baggages: 2,
      price: 0,
      pricePerKm: 2,
      pricePerHour: 30,
      minimumFare: 20,
      minimumHours: 2,
      returnPricePercentage: 100,
      discount: 0,
      category: "economy",
      childSeatPrice: 10,
      babySeatPrice: 10,
      stopPrice: 0,
      stopPricePerHour: 0,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filter and search logic
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {t("Dashboard.Fleet.fleet-management")}{" "}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t("Dashboard.Fleet.manage-your-vehicle-fleet-and-pricing")}{" "}
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {t("Dashboard.Fleet.add-vehicle")}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? t("Dashboard.Fleet.edit-vehicle")
                  : t("Dashboard.Fleet.add-new-vehicle")}
              </DialogTitle>
            </DialogHeader>
            <VehicleForm
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

      {/* Search and Filter Controls */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t(
                    "Dashboard.Fleet.search-vehicles-by-name-description-or-category"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 sm:h-9"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9">
                  <SelectValue placeholder={t("Dashboard.Fleet.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("Dashboard.Fleet.all-categories")}
                  </SelectItem>
                  <SelectItem value="economy">
                    {t("Dashboard.Fleet.economy")}
                  </SelectItem>
                  <SelectItem value="comfort">
                    {t("Dashboard.Fleet.comfort")}
                  </SelectItem>
                  <SelectItem value="business">
                    {t("Dashboard.Fleet.business")}
                  </SelectItem>
                  <SelectItem value="van">
                    {t("Dashboard.Fleet.van")}
                  </SelectItem>
                  <SelectItem value="luxury">
                    {t("Dashboard.Fleet.luxury")}
                  </SelectItem>
                  <SelectItem value="suv">
                    {t("Dashboard.Fleet.suv")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-10 sm:h-9">
                  <SelectValue placeholder={t("Dashboard.Fleet.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("Dashboard.Fleet.all-status")}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("Dashboard.Fleet.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("Dashboard.Fleet.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-dashed border-border bg-card">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Car className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {vehicles.length === 0
                      ? t("Dashboard.Fleet.no-vehicles-yet")
                      : t("Dashboard.Fleet.no-vehicles-match-your-filters")}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                    {vehicles.length === 0
                      ? t(
                          "Dashboard.Fleet.get-started-by-adding-your-first-vehicle-to-the-fleet"
                        )
                      : t(
                          "Dashboard.Fleet.try-adjusting-your-search-or-filter-criteria"
                        )}
                  </p>
                  {vehicles.length === 0 && (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Dashboard.Fleet.add-your-first-vehicle")}{" "}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  resolveImageSrc={resolveImageSrc}
                />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Vehicle Card Component
const VehicleCard = ({
  vehicle,
  onEdit,
  onDelete,
  resolveImageSrc
}: {
  vehicle: IVehicle;
  onEdit: (vehicle: IVehicle) => void;
  onDelete: (id: string) => void;
  resolveImageSrc: (src: string) => string;
}) => {
  const t = useTranslations();
  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 bg-card min-w-[350px] sm:min-w-[300px] ${
        !vehicle.isActive ? "opacity-60" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate text-foreground">
              {vehicle.name}
            </CardTitle>
            <Badge
              variant="secondary"
              className="mt-1 capitalize bg-primary/10 text-primary hover:bg-primary/20"
            >
              {vehicle.category}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(vehicle)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(vehicle._id!)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {vehicle.image && (
          <div className="relative w-full h-28 sm:h-32 bg-muted rounded-lg overflow-hidden">
            <Image
              src={resolveImageSrc(vehicle.image)}
              alt={vehicle.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">
          {vehicle.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">
              {vehicle.persons} {t("Dashboard.Fleet.seats")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">
              {vehicle.baggages} {t("Dashboard.Fleet.bags")}
            </span>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <Badge
            variant={vehicle.isActive ? "default" : "secondary"}
            className={
              vehicle.isActive
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            }
          >
            {vehicle.isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("Dashboard.Fleet.active")}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                {t("Dashboard.Fleet.inactive")}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Vehicle Form Component
const VehicleForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: {
  formData: VehicleForm;
  setFormData: (data: VehicleForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}) => {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
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
          <ImageSuggestions
            currentValue={formData.image}
            onSelect={(img) => setFormData({ ...formData, image: img })}
          />
        </div>

        {/* Pricing Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">
            {t("Dashboard.Fleet.pricing")}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.base-price-eur", {0: currencySymbol}) }{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="50"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.starting-fare-before-distance-calculation")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.price-per-km-eur", {0: currencySymbol})}{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="2"
            value={formData.pricePerKm}
            onChange={(e) =>
              setFormData({
                ...formData,
                pricePerKm: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.rate-charged-per-kilometer")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.price-per-hour-eur", {0: currencySymbol})}{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="30"
            value={formData.pricePerHour}
            onChange={(e) =>
              setFormData({
                ...formData,
                pricePerHour: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.rate-charged-per-hour")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.minimum-fare-eur", {0: currencySymbol})}{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="20"
            value={formData.minimumFare}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumFare: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.minimum-charge-for-trips")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.minimum-hours")}{" "}
          </label>
          <Input
            required
            type="number"
            min="1"
            step="1"
            placeholder="2"
            value={formData.minimumHours}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumHours: parseInt(e.target.value) || 1,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.minimum-hours-for-bookings")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.return-trip-price")}{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            placeholder="100"
            value={formData.returnPricePercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                returnPricePercentage: parseInt(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.percentage-for-return-trips")}{" "}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.discount")}
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={formData.discount}
            onChange={(e) =>
              setFormData({
                ...formData,
                discount: parseInt(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.discount-percentage")}{" "}
          </p>
        </div>

        {/* Capacity Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">
            {t("Dashboard.Fleet.capacity-and-features")}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.persons-capacity")}{" "}
          </label>
          <Input
            required
            type="number"
            min="1"
            max="50"
            placeholder="4"
            value={formData.persons}
            onChange={(e) =>
              setFormData({
                ...formData,
                persons: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.baggages-capacity")}{" "}
          </label>
          <Input
            required
            type="number"
            min="0"
            max="20"
            placeholder="2"
            value={formData.baggages}
            onChange={(e) =>
              setFormData({
                ...formData,
                baggages: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.child-seat-price-eur", {0: currencySymbol})}{" "}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="10"
            value={formData.childSeatPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                childSeatPrice: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.baby-seat-price-eur", {0: currencySymbol})}{" "}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="10"
            value={formData.babySeatPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                babySeatPrice: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* Stop Pricing Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">
            {t("Dashboard.Fleet.stop-pricing")}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.stop-base-price", {0: currencySymbol})}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={formData.stopPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                stopPrice: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.stop-base-price-description")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("Dashboard.Fleet.stop-price-per-hour", {0: currencySymbol})}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={formData.stopPricePerHour}
            onChange={(e) =>
              setFormData({
                ...formData,
                stopPricePerHour: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("Dashboard.Fleet.stop-price-per-hour-description")}
          </p>
        </div>

        {/* Status */}
        <div className="md:col-span-2">
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
              {t("Dashboard.Fleet.active-available-for-booking")}{" "}
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {editingId
                ? t("Dashboard.Fleet.update-vehicle")
                : t("Dashboard.Fleet.add-vehicle")}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Dashboard.Fleet.cancel")}{" "}
        </Button>
      </div>
    </form>
  );
};

export default FleetPage;

// Small ImageSuggestions component (client-side) that queries the new API
function ImageSuggestions({
  currentValue,
  onSelect,
}: {
  currentValue: string;
  onSelect: (img: string) => void;
}) {
  const [images, setImages] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState(currentValue || "");

  React.useEffect(() => setQuery(currentValue || ""), [currentValue]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/fleet-images");
        const json = await res.json();
        if (!mounted) return;
        if (json && json.success && Array.isArray(json.data)) {
          setImages(json.data);
        }
      } catch (err) {
        console.warn("Failed to fetch fleet images", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const suggestions = React.useMemo(() => {
    if (!query) return images.slice(0, 12);
    return images.filter((i) => i.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  }, [images, query]);

  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {suggestions.map((img) => (
          <button
            type="button"
            key={img}
            onClick={() => onSelect(img)}
            className="group flex flex-col items-start text-left text-xs"
            title={img}
          >
            <div className="relative w-full h-14 bg-muted rounded overflow-hidden">
              <Image src={img} alt={img} fill unoptimized className="object-cover" />
            </div>
            <div className="truncate w-full mt-1 text-xxs text-muted-foreground">{img.replace(/^\//, "")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
