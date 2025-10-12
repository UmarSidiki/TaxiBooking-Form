# Stripe Payment Methods Configuration

## Overview
The booking form now uses a simplified payment method structure where **Stripe Payment** includes all digital payment options.

## Payment Methods Available

### 1. **Stripe Payment** (Card)
When customers select "Stripe Payment", Stripe automatically shows available payment methods based on:
- Customer's location
- Currency
- Device/browser capabilities
- Your Stripe account configuration

**Included payment methods:**
- ✅ Credit/Debit Cards (Visa, Mastercard, Amex, Discover, etc.)
- ✅ PayPal (if enabled in Stripe Dashboard)
- ✅ Apple Pay (automatically shown on Safari/iOS when available)
- ✅ Google Pay (automatically shown on Chrome/Android when available)
- ✅ Buy Now Pay Later: Klarna, Affirm, Afterpay (region-dependent)
- ✅ Cash App Pay (US only)
- ✅ Link (Stripe's one-click checkout)
- ✅ Regional methods: Bancontact, EPS, iDEAL, SOFORT, etc.

### 2. **Cash Payment**
- Customer pays in cash upon service delivery
- Booking is marked as "pending payment"
- Suitable for local/taxi services

### 3. **Bank Transfer**
- Direct bank transfer to your account
- Shows your bank details to customers
- Manual payment verification required

## Configuration

### In Stripe Dashboard:
1. Go to [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable the payment methods you want to accept:
   - Cards (always enabled)
   - PayPal
   - Apple Pay & Google Pay
   - Klarna, Affirm, Afterpay
   - Regional methods (Bancontact, EPS, iDEAL, etc.)

### In Your Application (Dashboard → Settings):
1. **Stripe Configuration Tab:**
   - Add your Stripe Publishable Key
   - Add your Stripe Secret Key
   - Choose Test/Live mode
   - Select currency

2. **Payment Methods Tab:**
   - Check "Stripe Payment" to enable all Stripe methods
   - Check "Cash Payment" if you accept cash
   - Check "Bank Transfer" if you accept bank transfers
   - Fill in bank details if bank transfer is enabled

## Technical Implementation

### Payment Intent Configuration
Located in: `src/app/api/create-payment-intent/route.ts`

```typescript
payment_method_types: ['card', 'paypal', 'klarna', 'affirm', 'cashapp', 'link']
```

### Payment Element Configuration
Located in: `src/components/payment/StripePaymentForm.tsx`

```typescript
<PaymentElement 
  options={{
    wallets: {
      applePay: 'auto',
      googlePay: 'auto',
    }
  }}
/>
```

## Customer Experience

When a customer selects "Stripe Payment":
1. Payment form loads with Stripe's secure checkout
2. Available payment methods are shown in an accordion layout
3. Customer sees only methods available for their:
   - Location (country)
   - Currency
   - Device (Apple Pay on iOS, Google Pay on Android)
4. Customer selects preferred method and completes payment
5. All payments processed securely through Stripe

## Benefits of This Approach

✅ **Simplified Admin UI** - One checkbox for all Stripe methods  
✅ **Dynamic Payment Options** - Shows relevant methods per customer  
✅ **Automatic Updates** - New Stripe methods appear automatically  
✅ **Better Conversion** - More payment options = more completed bookings  
✅ **Single Integration** - No need to integrate each wallet separately  
✅ **Secure & PCI Compliant** - Stripe handles all security  

## Notes

- **Apple Pay & Google Pay** appear automatically based on device/browser - no extra integration needed
- **PayPal** requires enabling in your Stripe account settings
- **Buy Now Pay Later** options (Klarna, Affirm) depend on:
  - Your Stripe account approval
  - Customer's location
  - Transaction amount
- Some methods may have additional fees - check Stripe pricing

## Support & Resources

- [Stripe Payment Methods Documentation](https://stripe.com/docs/payments/payment-methods)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Enable PayPal in Stripe](https://stripe.com/docs/payments/paypal)
- [Apple Pay Guide](https://stripe.com/docs/apple-pay)
- [Google Pay Guide](https://stripe.com/docs/google-pay)
