import { Setting } from '@/features/settings/model';

const DEFAULT_CURRENCY = 'EUR';

export async function getSettingsCurrency(): Promise<string> {
  try {
    const setting = await Setting.findOne();
    return setting?.stripeCurrency?.toUpperCase() || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}
