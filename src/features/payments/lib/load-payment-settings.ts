import { connectDB } from '@/lib/database';
import { Setting } from '@/models/settings';

export async function loadPaymentSettings() {
  await connectDB();
  const settings = await Setting.findOne();
  return { settings };
}
