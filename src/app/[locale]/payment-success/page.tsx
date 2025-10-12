"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'processing'>('loading');
  const [message, setMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string>('/');

  useEffect(() => {
    // Fetch redirect URL from settings
    const fetchRedirectUrl = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
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
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (!paymentIntentId) {
      setStatus('failed');
      setMessage('No payment information found.');
      return;
    }

    // Handle different redirect statuses
    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('Payment successful! Your booking has been confirmed.');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(redirectUrl);
      }, 3000);
    } else if (redirectStatus === 'processing') {
      setStatus('processing');
      setMessage('Your payment is being processed. You will receive a confirmation email shortly.');
      
      setTimeout(() => {
        router.push(redirectUrl);
      }, 5000);
    } else if (redirectStatus === 'failed') {
      setStatus('failed');
      setMessage('Payment failed. Please try again or contact support if the problem persists.');
    } else {
      setStatus('failed');
      setMessage('Payment status unknown. Please contact support with your payment ID: ' + paymentIntentId);
    }
  }, [searchParams, router, redirectUrl]);

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  You will receive a confirmation email shortly.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to home page in 3 seconds...
                </p>
              </div>
              <Button 
                onClick={handleReturnHome}
                className="mt-6 w-full bg-green-600 hover:bg-green-700"
              >
                Return to Home
              </Button>
            </>
          )}

          {status === 'processing' && (
            <>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  This may take a few minutes. We&apos;ll send you an email once completed.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to home page in 5 seconds...
                </p>
              </div>
              <Button 
                onClick={handleReturnHome}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
              >
                Return to Home
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleReturnHome}
                  variant="outline"
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Common issues:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 text-left">
                  <li>• Insufficient funds</li>
                  <li>• Card expired or blocked</li>
                  <li>• Incorrect card details</li>
                  <li>• Payment declined by bank</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
