"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Mail, Phone, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [redirectUrl, setRedirectUrl] = useState<string>('/');
  const { settings } = useTheme();

  const tripId = searchParams.get('tripId');
  const amount = searchParams.get('amount');
  const paymentMethod = searchParams.get('method');

  useEffect(() => {
    if (settings?.redirectUrl) {
      setRedirectUrl(settings.redirectUrl);
    }
  }, [settings]);

  useEffect(() => {
    try {
      router.prefetch(redirectUrl);
    } catch (error) {
      // Prefetch is a best-effort hint; ignore failures
      console.debug('Prefetch failed', error);
    }
  }, [router, redirectUrl]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(redirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, redirectUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-6 sm:p-8 lg:p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Thank You for Your Booking!
            </h1>
            <p className="text-lg text-gray-600">
              Your trip has been successfully confirmed
            </p>
          </div>

          {/* Booking Details */}
          {tripId && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-green-200">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium text-gray-600">Trip ID:</span>
                  <span className="text-sm sm:text-lg font-bold text-gray-900 font-mono break-all sm:break-normal">
                    {tripId}
                  </span>
                </div>
                {amount && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-gray-600">Amount:</span>
                    <span className="text-lg font-bold text-green-600">€{amount}</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Email Info */}
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Confirmation Email Sent</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  We&apos;ve sent a confirmation email with all your booking details. 
                  Please check your inbox and spam folder.
                </p>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Need Help?</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Contact our 24/7 support team at{' '}
                  <a href="tel:+41763868121" className="text-primary font-medium hover:underline break-all">
                    +41 76 386 81 21
                  </a>
                  {' '}or{' '}
                  <a href="mailto:booking@swissride-sarl.ch" className="text-primary font-medium hover:underline break-all">
                    booking@swissride-sarl.ch
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Redirect Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Redirecting in <strong className="text-primary">{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
              </span>
            </div>
            
            <Button
              onClick={() => router.push(redirectUrl)}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
