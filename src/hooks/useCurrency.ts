import { useState, useEffect } from 'react';
import { apiGet } from '@/utils/api';

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchCurrency();
  }, []);

  return { currency, loading };
}