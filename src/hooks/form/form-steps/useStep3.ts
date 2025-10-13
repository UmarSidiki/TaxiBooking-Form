"use client";

import { useState, useEffect } from "react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ISetting } from "@/models/Setting";

export function useStep3() {
  const t = useTranslations();
  const router = useRouter();
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    vehicles,
    distanceData,
    setCurrentStep,
    isLoading,
    setIsLoading,
    resetForm,
  } = useBookingForm();

  const [stripeConfig, setStripeConfig] = useState<{
    enabled: boolean;
    publishableKey: string | null;
  }>({
    enabled: false,
    publishableKey: null,
  });
  const [paymentSettings, setPaymentSettings] = useState<ISetting | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch payment configuration
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (data.success) {
          setPaymentSettings(data.data);
          if (data.data.stripePublishableKey) {
            setStripeConfig({
              enabled: true,
              publishableKey: data.data.stripePublishableKey,
            });
          }
          // Set default payment method
          if (data.data.acceptedPaymentMethods?.length > 0) {
            setSelectedPaymentMethod(data.data.acceptedPaymentMethods[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching payment config:", error);
      }
    };
    fetchPaymentConfig();
  }, []);

  const selectedVehicle = vehicles.find(
    (v) => v._id === formData.selectedVehicle
  );

  const calculateVehiclePrice = () => {
    if (!selectedVehicle) return 0;

    // Hourly booking calculation
    if (formData.bookingType === "hourly") {
      const pricePerHour = selectedVehicle.pricePerHour || 30;
      const minimumHours = selectedVehicle.minimumHours || 2;
      const hours = Math.max(formData.duration, minimumHours);
      return pricePerHour * hours;
    }
    // Destination-based booking calculation
    else {
      if (!distanceData) {
        return selectedVehicle.price;
      }
      const distancePrice =
        selectedVehicle.pricePerKm * distanceData.distance.km;
      let oneWayPrice = selectedVehicle.price + distancePrice;
      oneWayPrice = Math.max(oneWayPrice, selectedVehicle.minimumFare);

      let totalPrice = oneWayPrice;
      if (formData.tripType === "roundtrip") {
        const returnPercentage =
          selectedVehicle.returnPricePercentage === undefined
            ? 100
            : selectedVehicle.returnPricePercentage;
        totalPrice = oneWayPrice + oneWayPrice * (returnPercentage / 100);
      }
      return totalPrice;
    }
  };

  const vehiclePrice = calculateVehiclePrice();

  // Apply discount
  const discount = selectedVehicle?.discount || 0;
  const discountedVehiclePrice =
    discount > 0 ? vehiclePrice * (1 - discount / 100) : vehiclePrice;

  const childSeatPrice = selectedVehicle?.childSeatPrice || 10;
  const babySeatPrice = selectedVehicle?.babySeatPrice || 10;
  const extrasPrice =
    formData.childSeats * childSeatPrice + formData.babySeats * babySeatPrice;
  const totalPrice = discountedVehiclePrice + extrasPrice;

  // Auto-initiate Stripe payment intent when 'card' is selected
  useEffect(() => {
    if (
      selectedPaymentMethod === "card" &&
      stripeConfig.publishableKey &&
      !clientSecret &&
      !creatingPaymentIntent
    ) {
      setCreatingPaymentIntent(true);
      setPaymentError(null);

      console.log("Creating payment intent with amount:", totalPrice);

      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          currency: paymentSettings?.stripeCurrency || "eur",
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          description: `Booking from ${formData.pickup} to ${formData.dropoff}`,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Payment intent response:", data);
          if (data.success && data.clientSecret) {
            setClientSecret(data.clientSecret);
            setPaymentError(null);
          } else {
            const errorMsg = data.message || t('Step3.failed-to-initialize-payment');
            console.error("Payment intent init failed:", errorMsg);
            setPaymentError(errorMsg);
          }
        })
        .catch((err) => {
          console.error("Error initializing payment intent:", err);
          setPaymentError(err.message || t('Step3.network-error-occurred'));
        })
        .finally(() => setCreatingPaymentIntent(false));
    }
  }, [
    selectedPaymentMethod,
    stripeConfig.publishableKey,
    clientSecret,
    creatingPaymentIntent,
    totalPrice,
    paymentSettings?.stripeCurrency,
    formData.email,
    formData.firstName,
    formData.lastName,
    formData.pickup,
    formData.dropoff,
    t,
  ]);

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "stripe",
          totalAmount: totalPrice,
          stripePaymentIntentId: paymentIntentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetForm();
        // Redirect to thank you page with booking details
        router.push(
          `/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
            2
          )}&method=stripe`
        );
      } else {
        alert(t('booking-failed-data-message'));
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(t('Step3.booking-failed-please-try-again'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePaymentError = () => {
    alert(t('Step3.payment-failed-error'));
  };

  const handleCashBooking = async () => {
    // Validate required fields
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = t('Step3.first-name-is-required');
    if (!formData.lastName.trim()) newErrors.lastName = t('Step3.last-name-is-required');
    if (!formData.email.trim()) newErrors.email = t('Step3.email-is-required');
    if (!formData.phone.trim()) newErrors.phone = t('Step3.phone-is-required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "cash",
          paymentStatus: "pending",
          totalAmount: totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetForm();
        // Redirect to thank you page with booking details
        router.push(
          `/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
            2
          )}&method=cash`
        );
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankTransferBooking = async () => {
    // Validate required fields
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = t('Step3.first-name-is-required');
    if (!formData.lastName.trim()) newErrors.lastName = t('Step3.last-name-is-required');
    if (!formData.email.trim()) newErrors.email = t('Step3.email-is-required');
    if (!formData.phone.trim()) newErrors.phone = t('Step3.phone-is-required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "bank_transfer",
          paymentStatus: "pending",
          totalAmount: totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetForm();
        // Redirect to thank you page with booking details
        router.push(
          `/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
            2
          )}&method=bank_transfer`
        );
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return {
    // State
    stripeConfig,
    paymentSettings,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    clientSecret,
    creatingPaymentIntent,
    paymentError,

    // Context values
    formData,
    setFormData,
    errors,
    selectedVehicle,
    distanceData,
    isLoading,

    // Calculated values
    vehiclePrice,
    discount,
    discountedVehiclePrice,
    childSeatPrice,
    babySeatPrice,
    extrasPrice,
    totalPrice,

    // Functions
    handleStripePaymentSuccess,
    handleStripePaymentError,
    handleCashBooking,
    handleBankTransferBooking,
    handleBack,
  };
}