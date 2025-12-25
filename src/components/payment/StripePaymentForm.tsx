"use client";

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Lock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getCurrencySymbol } from '@/lib/utils';

interface BookingData {
  pickup: string;
  dropoff?: string;
  stops?: Array<{ location: string; order: number; duration?: number }>;
  tripType: string;
  bookingType?: string;
  duration?: number;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  flightNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
}

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  orderId?: string;
  bookingData?: BookingData;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({ 
  amount, 
  currency = 'EUR',
  orderId,
  bookingData,
  onSuccess, 
  onError 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);


  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: t('Stripe.payment-system-not-ready-please-refresh-the-page') });
      return;
    }

    setIsProcessing(true);
    setMessage({ type: 'info', text: t('Stripe.processing-your-payment') });

    try {
      // Update pending booking with latest data before confirming payment
      if (orderId && bookingData) {
        try {
          const updateResponse = await fetch('/api/update-pending-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, bookingData }),
          });
          
          if (!updateResponse.ok) {
            console.warn('Failed to update pending booking, continuing with payment...');
          } else {
            console.log('✅ Pending booking updated before payment confirmation');
          }
        } catch (updateError) {
          console.warn('Error updating pending booking:', updateError);
          // Continue with payment even if update fails
        }
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Use current page as return URL to handle payment without redirect
          return_url: window.location.href,
        },
        redirect: 'if_required', // Only redirect if absolutely necessary (e.g., 3D Secure)
      });

      if (error) {
        const errorMessage = error.type === 'card_error' || error.type === 'validation_error'
          ? error.message
          : t('Stripe.an-unexpected-error-occurred-please-try-again');
        
        setMessage({ type: 'error', text: errorMessage || t('Stripe.payment-failed') });
        onError(errorMessage || t('Stripe.payment-failed'));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage({ type: 'success', text: t('Stripe.payment-successful-processing-your-booking') });
        setTimeout(() => onSuccess(paymentIntent.id), 1000);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        setMessage({ type: 'info', text: t('Stripe.payment-is-processing-you-will-receive-a-confirmation-shortly') });
        // Still call success callback for processing status
        setTimeout(() => onSuccess(paymentIntent.id), 1500);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setMessage({ type: 'info', text: t('Stripe.additional-authentication-required-please-follow-the-prompts') });
      } else {
        setMessage({ type: 'error', text: t('Stripe.payment-status-unclear-please-contact-support') });
        onError(t('Stripe.payment-status') + (paymentIntent?.status || 'unknown'));
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage({ type: 'error', text: t('Stripe.an-unexpected-error-occurred-please-try-again') });
      onError(t('Stripe.payment-processing-failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('Stripe.total-amount')} </p>
            <p className="text-3xl font-bold text-gray-900">
              {getCurrencySymbol(currency)}{amount.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Shield className="h-4 w-4" />
              {t('Stripe.secure')} </div>
            <p className="text-xs text-gray-500 mt-1">{t('Stripe.256-bit-ssl')}</p>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">{t('Stripe.payment-details')}</h3>
        </div>
        <PaymentElement 
          options={{
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {message.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
          {message.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
          {message.type === 'info' && <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />}
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' :
            message.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('Stripe.processing-payment')} </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            {t('Stripe.pay')} {getCurrencySymbol(currency)}{amount.toFixed(2)} {t('Stripe.securely')}
          </>
        )}
      </Button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4" />
          <span>{t('Stripe.secured-by-stripe')}</span>
        </div>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="h-4 w-4" />
          <span>{t('Stripe.pci-dss-compliant')}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {t('Stripe.your-payment-information-is-encrypted-and-secure-we-never-store-your-card-details')} </p>
    </form>
  );
}
