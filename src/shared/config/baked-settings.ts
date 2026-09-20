import bakedSettings from '@/config/baked-settings.json';

export interface BakedSettings {
  adminEmail: string | null;
  stripeCurrency: string;
  primaryColor: string;
  syncedAt: string | null;
}

const defaults: BakedSettings = {
  adminEmail: null,
  stripeCurrency: 'EUR',
  primaryColor: '#EAB308',
  syncedAt: null,
};

export function getBakedSettings(): BakedSettings {
  return { ...defaults, ...(bakedSettings as BakedSettings) };
}
