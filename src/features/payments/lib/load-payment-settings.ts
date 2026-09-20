import { connectDB } from '@/shared/db';
import { Setting } from '@/features/settings/model';

export async function loadPaymentSettings() {
  await connectDB();
  const settings = await Setting.findOne();
  return { settings };
}
