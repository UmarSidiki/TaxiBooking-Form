"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiGet } from '@/utils/api';
import { completePaymentWithRetry } from '@/utils/complete-payment';
import { useTranslations } from 'next-intl';

export default function PaymentSuccessPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'processing'>('loading');
  const [message, setMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string>('/');
  const completionStarted = useRef(false);

  useEffect(() => {
    const fetchRedirectUrl = async () => {
      try {
        const data = await apiGet<{ success: boolean; data: { redirectUrl?: string } }>('/api/settings');
        if (data.success && data.data.redirectUrl) {
          setRedirectUrl(data.data.redirectUrl);
        }
      } catch (error) {
        console.error('Error fetching redirect URL:', error);
      }
    };
    fetchRedirectUrl();
  }, []);

  useEffect(() => {
    if (completionStarted.current) return;

    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');
    const transactionId = searchParams.get('transactionid');
    const mspOrderId =
      searchParams.get('order_id') ||
      searchParams.get('orderid') ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('msp_order_id') : null);

    if (!paymentIntentId && !transactionId && !mspOrderId) {
      setStatus('failed');
      setMessage(t('ThankYouPage.no-payment-information-found'));
      return;
    }

    if (paymentIntentId && redirectStatus === 'failed') {
      setStatus('failed');
      setMessage(t('ThankYouPage.payment-failed-please-try-again-or-contact-support-if-the-problem-persists'));
      return;
    }

    completionStarted.current = true;

    const runCompletion = async () => {
      const payload = transactionId || mspOrderId
        ? {
            provider: 'multisafepay' as const,
            transactionId: transactionId || undefined,
            orderId: mspOrderId || undefined,
          }
        : {
            provider: 'stripe' as const,
            paymentIntentId: paymentIntentId!,
          };

      const result = await completePaymentWithRetry(payload);

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('msp_order_id');
      }

      if (result.success) {
        setStatus('success');
        setMessage(t('ThankYouPage.payment-successful-your-booking-has-been-confirmed'));
        setTimeout(() => router.push(redirectUrl), 3000);
        return;
      }

      if (
        paymentIntentId &&
        (redirectStatus === 'succeeded' || redirectStatus === 'processing')
      ) {
        setStatus(redirectStatus === 'processing' ? 'processing' : 'success');
        setMessage(
          redirectStatus === 'processing'
            ? t('ThankYouPage.your-payment-is-being-processed-you-will-receive-a-confirmation-email-shortly')
            : t('ThankYouPage.payment-successful-your-booking-has-been-confirmed')
        );
        setTimeout(() => router.push(redirectUrl), redirectStatus === 'processing' ? 5000 : 3000);
        return;
      }

      setStatus('failed');
      setMessage(result.message || t('ThankYouPage.payment-status-unknown-please-contact-support-with-your-payment-id'));
    };

    runCompletion();
  }, [searchParams, router, redirectUrl, t]);

  const handleReturnHome = () => {
    router.push(redirectUrl);
  };

  const handleRetry = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-blue-600 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('ThankYouPage.processing-payment')}</h1>
              <p className="text-gray-600">{t('ThankYouPage.please-wait-while-we-verify-your-payment')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('ThankYouPage.payment-successful')}</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {t('ThankYouPage.you-will-receive-a-confirmation-email-shortly')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('ThankYouPage.redirecting-to-home-page-in-3-seconds')}
                </p>
              </div>
              <Button
                onClick={handleReturnHome}
                className="mt-6 w-full bg-green-600 hover:bg-green-700"
              >
                {t('ThankYouPage.return-to-home')}
              </Button>
            </>
          )}

          {status === 'processing' && (
            <>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('ThankYouPage.payment-processing')}</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button
                onClick={handleReturnHome}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
              >
                {t('ThankYouPage.return-to-home')}
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('ThankYouPage.payment-failed')}</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full bg-primary hover:bg-primary/90">
                  {t('ThankYouPage.try-again')}
                </Button>
                <Button onClick={handleReturnHome} variant="outline" className="w-full">
                  {t('ThankYouPage.return-to-home')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
