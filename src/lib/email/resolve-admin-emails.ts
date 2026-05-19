import { connectDB } from '@/lib/database';
import { getBakedSettings } from '@/lib/settings/baked-settings';
import { Setting } from '@/models/settings';
import { User } from '@/models/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email?: string | null): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * Resolves all admin notification recipients: DB admins, baked adminEmail,
 * settings.adminEmail, ADMIN_EMAIL env, then smtpFrom as last resort.
 */
export async function resolveAdminNotificationEmails(): Promise<string[]> {
  await connectDB();

  const settings = await Setting.findOne().lean();
  const baked = getBakedSettings();
  const emails = new Set<string>();

  const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('email')
    .lean();

  for (const user of adminUsers) {
    if (isValidEmail(user.email)) {
      emails.add(user.email.toLowerCase());
    }
  }

  const fallbacks = [
    settings?.adminEmail,
    baked.adminEmail,
    process.env.ADMIN_EMAIL,
    settings?.smtpFrom,
    settings?.smtpUser,
  ];

  for (const candidate of fallbacks) {
    if (isValidEmail(candidate)) {
      emails.add(candidate.toLowerCase());
    }
  }

  return Array.from(emails);
}
