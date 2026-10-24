import { Badge } from '@/shared/ui/badge';
import { CheckCircle, Clock, RefreshCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BADGE_CLASSES =
  'font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs';

export function RidePaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations();

  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className={BADGE_CLASSES}>
          <CheckCircle className="w-3 h-3" /> {t('Dashboard.Rides.Paid')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className={BADGE_CLASSES}>
          <Clock className="w-3 h-3" /> {t('Dashboard.Rides.Pending')}
        </Badge>
      );
    case 'refunded':
      return (
        <Badge variant="default" className={BADGE_CLASSES}>
          <RefreshCw className="w-3 h-3" /> {t('Dashboard.Rides.Refunded')}
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className={BADGE_CLASSES}>
          <X className="w-3 h-3" /> {t('Dashboard.Rides.Failed')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`${BADGE_CLASSES} bg-muted text-foreground`}>
          {status}
        </Badge>
      );
  }
}
