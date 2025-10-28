"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { apiGet } from '@/utils/api';
import { useTranslations } from 'next-intl';

export default function PaymentCancelledPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string>('/');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch redirect URL from settings
    const fetchRedirectUrl = async () => {
      try {
        const data = await apiGet<{ success: boolean; data: { redirectUrl?: string } }>('/api/settings');
        if (data.success && data.data.redirectUrl) {
          setRedirectUrl(data.data.redirectUrl);
        }
      } catch (error) {
        console.error('Error fetching redirect URL:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRedirectUrl();
  }, []);

  const transactionId = searchParams.get('transactionid');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Mark the booking as cancelled if we have a transaction ID or order ID
    const cancelBooking = async () => {
      if (transactionId || orderId) {
        try {
          await fetch('/api/cancel-multisafepay-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              transactionId,
              orderId 
            }),
          });
        } catch (error) {
          console.error('Error cancelling booking:', error);
        }
      }
    };
    
    if (!isLoading) {
      cancelBooking();
    }
  }, [transactionId, orderId, isLoading]);

  const handleReturnHome = () => {
    router.push(redirectUrl);
  };

  const handleTryAgain = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <Loader2 className="h-16 w-16 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">{t('ThankYouPage.loading')}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('ThankYouPage.payment-cancelled')}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {t('ThankYouPage.you-cancelled-the-payment-no-charges-were-made')}
          </p>

          {transactionId && (
            <div className="bg-gray-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">
                {t('ThankYouPage.transaction-id')}
              </p>
              <p className="text-sm font-mono text-gray-700">
                {transactionId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleTryAgain}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('ThankYouPage.try-again')}
            </Button>
            
            <Button 
              onClick={handleReturnHome}
              variant="outline"
              className="w-full"
            >
              {t('ThankYouPage.return-to-home')}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>{t('ThankYouPage.need-help')}</strong>
            </p>
            <p className="text-xs text-blue-700 mt-2">
              {t('ThankYouPage.if-you-experienced-any-issues-please-contact-our-support-team')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
