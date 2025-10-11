"use client";

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Lock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({ 
  amount, 
  currency = 'EUR',
  onSuccess, 
  onError 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CHF': 'Fr',
      'JPY': '¥',
      'CAD': '$',
      'AUD': '$',
    };
    return symbols[curr.toUpperCase()] || curr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'Payment system not ready. Please refresh the page.' });
      return;
    }

    setIsProcessing(true);
    setMessage({ type: 'info', text: 'Processing your payment...' });

    try {
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
          : 'An unexpected error occurred. Please try again.';
        
        setMessage({ type: 'error', text: errorMessage || 'Payment failed' });
        onError(errorMessage || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage({ type: 'success', text: 'Payment successful! Processing your booking...' });
        setTimeout(() => onSuccess(), 1000);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        setMessage({ type: 'info', text: 'Payment is processing. You will receive a confirmation shortly.' });
        // Still call success callback for processing status
        setTimeout(() => onSuccess(), 1500);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setMessage({ type: 'info', text: 'Additional authentication required. Please follow the prompts.' });
      } else {
        setMessage({ type: 'error', text: 'Payment status unclear. Please contact support.' });
        onError('Payment status: ' + (paymentIntent?.status || 'unknown'));
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
      onError('Payment processing failed');
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
              Total Amount
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {getCurrencySymbol(currency)}{amount.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Secure
            </div>
            <p className="text-xs text-gray-500 mt-1">256-bit SSL</p>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Payment Details</h3>
        </div>
        <PaymentElement 
          options={{
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true
            }
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
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Pay {getCurrencySymbol(currency)}{amount.toFixed(2)} Securely
          </>
        )}
      </Button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="h-4 w-4" />
          <span>PCI DSS Compliant</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </form>
  );
}
