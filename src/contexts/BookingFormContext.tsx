"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

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

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);
      const savedDistance = localStorage.getItem(DISTANCE_KEY);
      const savedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
      
      // Check if data has expired (10 minutes)
      if (savedTimestamp) {
        const timestamp = parseInt(savedTimestamp);
        const now = Date.now();
        const elapsed = now - timestamp;
        
        if (elapsed > EXPIRATION_TIME) {
          // Data has expired, clear it
          console.log('Booking data expired after 10 minutes. Clearing localStorage.');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STEP_KEY);
          localStorage.removeItem(DISTANCE_KEY);
          localStorage.removeItem(TIMESTAMP_KEY);
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
      
      if (savedStep) {
        setCurrentStep(parseInt(savedStep) as 1 | 2 | 3);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save formData to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        // Update timestamp whenever data is saved
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  }, [formData, isHydrated]);

  // Save currentStep to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STEP_KEY, currentStep.toString());
      } catch (error) {
        console.error('Error saving step to localStorage:', error);
      }
    }
  }, [currentStep, isHydrated]);

  // Save distanceData to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        if (distanceData) {
          localStorage.setItem(DISTANCE_KEY, JSON.stringify(distanceData));
        } else {
          localStorage.removeItem(DISTANCE_KEY);
        }
      } catch (error) {
        console.error('Error saving distance data to localStorage:', error);
      }
    }
  }, [distanceData, isHydrated]);

  // Periodic check for expiration (every minute)
  useEffect(() => {
    if (!isHydrated) return;

    const intervalId = setInterval(() => {
      try {
        const savedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
        
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp);
          const now = Date.now();
          const elapsed = now - timestamp;
          
          if (elapsed > EXPIRATION_TIME) {
            // Data has expired, reset the form
            console.log('Booking data expired after 10 minutes. Resetting form.');
            resetForm();
          }
        }
      } catch (error) {
        console.error('Error checking expiration:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isHydrated]);

  // Fetch vehicles list on mount to persist selection across steps
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles?isActive=true');
        const data = await response.json();
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
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_KEY);
      localStorage.removeItem(DISTANCE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
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
