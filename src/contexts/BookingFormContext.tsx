"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from "@/utils/api";
import { IVehicle } from '@/models/Vehicle';

export interface FormData {
  bookingType: "destination" | "hourly";
  pickup: string;
  dropoff: string;
  tripType: "oneway" | "roundtrip";
  duration: number;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
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

// Use sessionStorage instead of localStorage to persist across refreshes but clear on tab close
const storage = typeof window !== 'undefined' ? sessionStorage : null;
const EXPIRATION_TIME = 10 * 60 * 500; // 5 minutes in milliseconds

const defaultFormData: FormData = {
  bookingType: "destination",
  pickup: "",
  dropoff: "",
  tripType: "oneway",
  duration: 2,
  date: "",
  time: "",
  passengers: 1,
  selectedVehicle: "",
  childSeats: 0,
  babySeats: 0,
  notes: "",
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

  // Load data from localStorage on mount (only if not embedded)
  useEffect(() => {
    if (isEmbedded) {
      // Don't use localStorage for embedded forms
      setIsHydrated(true);
      return;
    }

    try {
      // Check if URL has step parameter - if so, don't override with storage
      const urlParams = new URLSearchParams(window.location.search);
      const hasStepParam = urlParams.has('step');
      const hasSourceParam = urlParams.has('source');
      
      const savedData = storage?.getItem(STORAGE_KEY);
      const savedStep = storage?.getItem(STEP_KEY);
      const savedDistance = storage?.getItem(DISTANCE_KEY);
      const savedTimestamp = storage?.getItem(TIMESTAMP_KEY);
      
      // Check if data has expired (10 minutes)
      if (savedTimestamp) {
        const timestamp = parseInt(savedTimestamp);
        const now = Date.now();
        const elapsed = now - timestamp;
        
        if (elapsed > EXPIRATION_TIME) {
          // Data has expired, clear it
          console.log('Booking data expired after 5 minutes. Clearing sessionStorage.');
          storage?.removeItem(STORAGE_KEY);
          storage?.removeItem(STEP_KEY);
          storage?.removeItem(DISTANCE_KEY);
          storage?.removeItem(TIMESTAMP_KEY);
          setIsHydrated(true);
          return;
        }
      }
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      }
      
      if (savedDistance) {
        const parsedDistance = JSON.parse(savedDistance);
        setDistanceData(parsedDistance);
      }
      
      // Only load step from storage if URL doesn't have step or source params
      if (savedStep && !hasStepParam && !hasSourceParam) {
        setCurrentStep(parseInt(savedStep) as 1 | 2 | 3);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    setIsHydrated(true);
  }, [isEmbedded]);

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
        
        // Update URL params to reflect current step
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('step', currentStep.toString());
          window.history.replaceState({}, '', url.toString());
        }
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
