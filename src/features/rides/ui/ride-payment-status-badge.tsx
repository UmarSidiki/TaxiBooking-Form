import { Badge } from '@/shared/ui/badge';
import { CheckCircle, Clock, RefreshCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BADGE_CLASSES =
  'text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs';

export function RidePaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations();

  switch (status) {
    case 'completed':
      return (
        <Badge className={`${BADGE_CLASSES} bg-primary hover:bg-primary/90`}>
          <CheckCircle className="w-3 h-3" /> {t('Dashboard.Rides.Paid')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className={`${BADGE_CLASSES} bg-secondary hover:bg-secondary/90`}>
          <Clock className="w-3 h-3" /> {t('Dashboard.Rides.Pending')}
        </Badge>
      );
    case 'refunded':
      return (
        <Badge className={`${BADGE_CLASSES} bg-primary hover:bg-primary/90`}>
          <RefreshCw className="w-3 h-3" /> {t('Dashboard.Rides.Refunded')}
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          className={`${BADGE_CLASSES} bg-destructive hover:bg-destructive/90`}
        >
          <X className="w-3 h-3" /> {t('Dashboard.Rides.Failed')}
        </Badge>
      );
    default:
      return (
        <Badge
          className={`${BADGE_CLASSES} bg-muted hover:bg-muted/90 text-muted-foreground`}
        >
          {status}
        </Badge>
      );
  }
}
