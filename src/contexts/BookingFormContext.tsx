"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from "@/utils/api";
import { IVehicle } from '@/models/vehicle';
import { useSearchParams } from 'next/navigation';

export interface FormData {
  bookingType: "destination" | "hourly";
  pickup: string;
  dropoff: string;
  stops: Array<{
    location: string;
    order: number;
    duration?: number; // Duration in minutes (0-120)
  }>;
  tripType: "oneway" | "roundtrip";
  duration: number;
  date: string;
  time: string;
  returnDate: string;
  returnTime: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  flightNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface DistanceData {
  distance: {
    km: number;
    text: string;
  };
  duration: {
    minutes: number;
    text: string;
  };
}

export interface FormErrors {
  pickup?: string;
  dropoff?: string;
  date?: string;
  time?: string;
  returnDate?: string;
  returnTime?: string;
  duration?: string;
  passengers?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

interface BookingFormContextType {
  currentStep: 1 | 2 | 3;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  vehicles: IVehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<IVehicle[]>>;
  distanceData: DistanceData | null;
  setDistanceData: React.Dispatch<React.SetStateAction<DistanceData | null>>;
  calculatingDistance: boolean;
  setCalculatingDistance: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resetForm: () => void;
}

const BookingFormContext = createContext<BookingFormContextType | undefined>(undefined);

const STORAGE_KEY = 'booking_form_data';
const STEP_KEY = 'booking_form_step';
const DISTANCE_KEY = 'booking_form_distance';
const TIMESTAMP_KEY = 'booking_form_timestamp';

// Use localStorage to persist across refreshes
const storage = typeof window !== 'undefined' ? localStorage : null;
// Expiration time for saved form data (2 minutes in milliseconds)
const EXPIRATION_TIME = 2 * 60 * 1000;

const defaultFormData: FormData = {
  bookingType: "destination",
  pickup: "",
  dropoff: "",
  stops: [],
  tripType: "oneway",
  duration: 2,
  date: "",
  time: "",
  returnDate: "",
  returnTime: "",
  passengers: 1,
  selectedVehicle: "",
  childSeats: 0,
  babySeats: 0,
  notes: "",
  flightNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

export function BookingFormProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [distanceData, setDistanceData] = useState<DistanceData | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if we're in an iframe (embedded form)
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

  // Check for URL params that indicate deep linking
  const searchParams = useSearchParams();
  const hasDeepLinkParams = !!(
    searchParams?.get("step") ||
    searchParams?.get("source") ||
    searchParams?.get("bookingType") ||
    searchParams?.get("pickup") ||
    searchParams?.get("dropoff") ||
    searchParams?.get("stops") ||
    searchParams?.get("date") ||
    searchParams?.get("time") ||
    searchParams?.get("passengers") ||
    searchParams?.get("tripType") ||
    searchParams?.get("duration") ||
    searchParams?.get("flightNumber")
  );

  // Load saved formData and step on mount
  useEffect(() => {
    // Parse URL parameters if they exist (for both embedded and main forms)
    if (hasDeepLinkParams && searchParams) {
      const urlFormData = { ...defaultFormData };

      // Parse basic parameters
      const bookingType = searchParams.get("bookingType");
      if (bookingType === "destination" || bookingType === "hourly") {
        urlFormData.bookingType = bookingType;
      }

      const pickup = searchParams.get("pickup");
      if (pickup) urlFormData.pickup = pickup;

      const dropoff = searchParams.get("dropoff");
      if (dropoff) urlFormData.dropoff = dropoff;

      // Parse stops parameter (JSON string or comma-separated)
      const stopsParam = searchParams.get("stops");
      if (stopsParam) {
        try {
          // Try to parse as JSON first
          const parsedStops = JSON.parse(stopsParam);
          if (Array.isArray(parsedStops)) {
            urlFormData.stops = parsedStops.map((stop, index) => ({
              location: typeof stop === 'string' ? stop : stop.location || '',
              order: typeof stop === 'object' ? stop.order || index + 1 : index + 1
            }));
          }
        } catch {
          // If not JSON, treat as comma-separated string
          const stopsArray = stopsParam.split(',').map(s => s.trim()).filter(s => s);
          urlFormData.stops = stopsArray.map((stop, index) => ({
            location: stop,
            order: index + 1
          }));
        }
      }

      const tripType = searchParams.get("tripType");
      if (tripType === "oneway" || tripType === "roundtrip" || tripType === "return") {
        urlFormData.tripType = tripType === "return" ? "roundtrip" : tripType;
      }

      const duration = searchParams.get("duration");
      if (duration) {
        const durationNum = parseInt(duration, 10);
        if (!isNaN(durationNum) && durationNum > 0) {
          urlFormData.duration = durationNum;
        }
      }

      const date = searchParams.get("date");
      if (date) urlFormData.date = date;

      const time = searchParams.get("time");
      if (time) urlFormData.time = time;

      const returnDate = searchParams.get("returnDate");
      if (returnDate) urlFormData.returnDate = returnDate;

      const returnTime = searchParams.get("returnTime");
      if (returnTime) urlFormData.returnTime = returnTime;

      const passengers = searchParams.get("passengers");
      if (passengers) {
        const passengersNum = parseInt(passengers, 10);
        if (!isNaN(passengersNum) && passengersNum > 0) {
          urlFormData.passengers = passengersNum;
        }
      }

      const flightNumber = searchParams.get("flightNumber");
      if (flightNumber) urlFormData.flightNumber = flightNumber;

      setFormData(urlFormData);

      // Set step if provided
      const step = searchParams.get("step");
      if (step) {
        const stepNum = parseInt(step, 10);
        if (stepNum >= 1 && stepNum <= 3) {
          setCurrentStep(stepNum as 1 | 2 | 3);
        }
      }

      setIsHydrated(true);
      return;
    }

    // For embedded forms without deep link params, still set hydrated
    if (isEmbedded) {
      setIsHydrated(true);
      return;
    }

    try {
      const savedData = storage?.getItem(STORAGE_KEY);
      const savedDistance = storage?.getItem(DISTANCE_KEY);
      const savedTimestamp = storage?.getItem(TIMESTAMP_KEY);
      const savedStep = storage?.getItem(STEP_KEY);

      if (savedTimestamp && Date.now() - parseInt(savedTimestamp) <= EXPIRATION_TIME) {
        // Only load from localStorage if there are no deep link params
        if (!hasDeepLinkParams) {
          if (savedData) setFormData(JSON.parse(savedData));
          if (savedDistance) setDistanceData(JSON.parse(savedDistance));
          if (savedStep) {
            setCurrentStep(parseInt(savedStep, 10) as 1 | 2 | 3);
          }
        }
      } else {
        // Clear expired data
        storage?.removeItem(STORAGE_KEY);
        storage?.removeItem(DISTANCE_KEY);
        storage?.removeItem(TIMESTAMP_KEY);
        storage?.removeItem(STEP_KEY);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    setIsHydrated(true);
  }, [isEmbedded, hasDeepLinkParams, searchParams]);

  // Save formData to sessionStorage whenever it changes (only if not embedded)
  useEffect(() => {
    if (isHydrated && !isEmbedded) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(formData));
        // Update timestamp whenever data is saved
        storage?.setItem(TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error('Error saving form data to sessionStorage:', error);
      }
    }
  }, [formData, isHydrated, isEmbedded]);

  // Save currentStep to sessionStorage whenever it changes (only if not embedded)
  useEffect(() => {
    if (isHydrated && !isEmbedded) {
      try {
        storage?.setItem(STEP_KEY, currentStep.toString());
        
      } catch (error) {
        console.error('Error saving step to sessionStorage:', error);
      }
    }
  }, [currentStep, isHydrated, isEmbedded]);

  // Save distanceData to sessionStorage whenever it changes (only if not embedded)
  useEffect(() => {
    if (isHydrated && !isEmbedded) {
      try {
        if (distanceData) {
          storage?.setItem(DISTANCE_KEY, JSON.stringify(distanceData));
        } else {
          storage?.removeItem(DISTANCE_KEY);
        }
      } catch (error) {
        console.error('Error saving distance data to sessionStorage:', error);
      }
    }
  }, [distanceData, isHydrated, isEmbedded]);

  // Periodic check for expiration (every minute) - only for non-embedded forms
  useEffect(() => {
    if (!isHydrated || isEmbedded) return;

    const intervalId = setInterval(() => {
      try {
        const savedTimestamp = storage?.getItem(TIMESTAMP_KEY);
        
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp);
          const now = Date.now();
          const elapsed = now - timestamp;
          
          if (elapsed > EXPIRATION_TIME) {
            // Data has expired, reset the form
            console.log('Booking data expired after 5 minutes. Resetting form.');
            resetForm();
          }
        }
      } catch (error) {
        console.error('Error checking expiration:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isHydrated, isEmbedded]);


  // Fetch vehicles list on mount to persist selection across steps
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await apiFetch<{ success: boolean; data: IVehicle[] }>('/api/vehicles?isActive=true');
        if (data.success) {
          setVehicles(data.data);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
    fetchVehicles();
  }, []);

  const resetForm = () => {
    setFormData(defaultFormData);
    setErrors({});
    setCurrentStep(1);
    setDistanceData(null);
    try {
      storage?.removeItem(STORAGE_KEY);
      storage?.removeItem(STEP_KEY);
      storage?.removeItem(DISTANCE_KEY);
      storage?.removeItem(TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  };

  const value = {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    errors,
    setErrors,
    vehicles,
    setVehicles,
    distanceData,
    setDistanceData,
    calculatingDistance,
    setCalculatingDistance,
    isLoading,
    setIsLoading,
    resetForm,
  };

  return (
    <BookingFormContext.Provider value={value}>
      {children}
    </BookingFormContext.Provider>
  );
}

export function useBookingForm() {
  const context = useContext(BookingFormContext);
  if (context === undefined) {
    throw new Error('useBookingForm must be used within a BookingFormProvider');
  }
  return context;
}
