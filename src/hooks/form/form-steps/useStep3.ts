"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTheme } from "@/contexts/ThemeContext";
import { ISetting } from "@/models/Setting";

export function useStep3() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { settings } = useTheme();
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

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

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
  const [paymentInitialized, setPaymentInitialized] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        const [maps, routes] = await Promise.all([
          importLibrary("maps"),
          importLibrary("routes"),
        ]);

        // Initialize map
        if (mapRef.current && !googleMapRef.current) {
          const initialCenter =
            settings && settings.mapInitialLat && settings.mapInitialLng
              ? { lat: settings.mapInitialLat, lng: settings.mapInitialLng }
              : { lat: 46.2044, lng: 6.1432 }; // Default to Geneva

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 8,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          setMapLoaded(true);

          // If we have pickup and dropoff, show the route
          if (formData.pickup && formData.dropoff) {
            const directionsService = new routes.DirectionsService();

            const waypoints = formData.stops
              .filter(stop => stop.location.trim())
              .map(stop => ({
                location: stop.location,
                stopover: true,
              }));

            directionsService.route(
              {
                origin: formData.pickup,
                destination: formData.dropoff,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (
                result: google.maps.DirectionsResult | null,
                status: google.maps.DirectionsStatus
              ) => {
                if (status === "OK" && result && googleMapRef.current) {
                  if (!directionsRendererRef.current) {
                    directionsRendererRef.current =
                      new routes.DirectionsRenderer({
                        map: googleMapRef.current,
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: "var(--primary-color)",
                          strokeWeight: 4,
                        },
                      });
                  }
                  if (directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);
                  }
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    if (settings) {
      initGoogleMaps();
    }
  }, [settings, formData.pickup, formData.dropoff, formData.stops]);

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
            // Prefer card if available, otherwise use the first available method
            const defaultMethod = data.data.acceptedPaymentMethods.includes("card")
              ? "card"
              : data.data.acceptedPaymentMethods[0];
            setSelectedPaymentMethod(defaultMethod);
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

  const calculateVehiclePrice = useCallback(() => {
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
  }, [selectedVehicle, formData.bookingType, formData.duration, formData.tripType, distanceData]);

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

  // Create payment intent function
  const createPaymentIntent = useCallback(async () => {
    if (!stripeConfig.publishableKey || creatingPaymentIntent) return;
    
    setCreatingPaymentIntent(true);
    setPaymentError(null);

    console.log("Creating payment intent with amount:", totalPrice);

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          currency: paymentSettings?.stripeCurrency || "eur",
          customerEmail: formData.email || "customer@example.com", // Fallback email
          customerName: `${formData.firstName || "First"} ${formData.lastName || "Last"}`, // Fallback name
          description: `Booking from ${formData.pickup || "pickup"} to ${formData.dropoff || "dropoff"}`,
        }),
      });

      const data = await response.json();
      console.log("Payment intent response:", data);
      
      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentError(null);
        setPaymentInitialized(true);
      } else {
        const errorMsg = data.message || t('Step3.failed-to-initialize-payment');
        console.error("Payment intent init failed:", errorMsg);
        setPaymentError(errorMsg);
      }
    } catch (err) {
      console.error("Error initializing payment intent:", err);
      const errorMessage = err instanceof Error ? err.message : t('Step3.network-error-occurred');
      setPaymentError(errorMessage);
    } finally {
      setCreatingPaymentIntent(false);
    }
  }, [
    stripeConfig.publishableKey,
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

  // Auto-initiate Stripe payment intent when 'card' is selected
  useEffect(() => {
    if (
      selectedPaymentMethod === "card" &&
      stripeConfig.enabled &&
      !clientSecret &&
      !creatingPaymentIntent &&
      !paymentInitialized
    ) {
      createPaymentIntent();
    }
  }, [
    selectedPaymentMethod,
    stripeConfig.enabled,
    clientSecret,
    creatingPaymentIntent,
    paymentInitialized,
    createPaymentIntent
  ]);

  // Reset payment initialization when payment method changes
  useEffect(() => {
    if (selectedPaymentMethod !== "card") {
      setPaymentInitialized(false);
      setClientSecret(null);
    }
  }, [selectedPaymentMethod]);

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "stripe",
          paymentStatus: "completed",
          totalAmount: totalPrice,
          stripePaymentIntentId: paymentIntentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        resetForm();
        // Redirect to thank you page with booking details
        router.push(
          `/${locale}/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
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
    setPaymentError(t('Step3.payment-failed-error'));
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
          `/${locale}/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
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
          `/${locale}/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(
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

  const handleMultisafepayBooking = async () => {
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
      // Create MultiSafepay order directly without creating booking
      const paymentResponse = await fetch("/api/create-multisafepay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          currency: paymentSettings?.stripeCurrency || "eur",
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          description: `Booking from ${formData.pickup} to ${formData.dropoff || 'destination'}`,
          bookingData: formData,
          totalAmount: totalPrice,
          locale: locale,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.paymentUrl) {
        // Redirect to MultiSafepay payment page
        window.location.href = paymentData.paymentUrl;
      } else {
        alert(`Payment initialization failed: ${paymentData.message}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("MultiSafepay booking error:", error);
      alert("Booking failed. Please try again.");
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

    // Map state
    mapLoaded,
    mapRef,

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
    handleMultisafepayBooking,
    handleBack,
  };
}