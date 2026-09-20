export type PaymentProvider = 'stripe' | 'multisafepay';

export type FinalizePaidBookingInput = {
  provider: PaymentProvider;
  paymentIntentId?: string;
  transactionId?: string;
  orderId?: string;
  baseUrl?: string;
};

export type FinalizePaidBookingResult = {
  success: boolean;
  retryable?: boolean;
  message?: string;
  tripId?: string;
  bookingId?: string;
  alreadyExisted?: boolean;
  emails?: { confirmationSent: boolean; adminSent: boolean };
};

export type VerifiedPayment = {
  ok: true;
  orderId: string;
  paidAmount: number;
  currency: string;
  transactionId?: string;
};

export type UnverifiedPayment = {
  ok: false;
  message: string;
  retryable?: boolean;
};
