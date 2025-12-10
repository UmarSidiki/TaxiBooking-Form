"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet } from '@/utils/api';

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
  updateCurrency: (newCurrency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<string>('EUR');
  const [loading, setLoading] = useState(true);

  const fetchCurrency = async () => {
    try {
      const data = await apiGet<{
        success: boolean;
        data: { stripeCurrency?: string };
      }>("/api/settings");
      if (data.success && data.data.stripeCurrency) {
        setCurrency(data.data.stripeCurrency.toUpperCase());
      }
    } catch (error) {
      console.error("Error fetching currency:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrency = async () => {
    await fetchCurrency();
  };

  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency.toUpperCase());
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  const currencySymbol = (() => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$',
      'MXN': '$',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NOK': 'kr',
      'KRW': '₩',
      'TRY': '₺',
      'RUB': '₽',
      'INR': '₹',
      'BRL': 'R$',
      'ZAR': 'R',
    };
    return symbols[currency] || currency;
  })();

  return (
    <CurrencyContext.Provider value={{
      currency,
      currencySymbol,
      loading,
      refreshCurrency,
      updateCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}