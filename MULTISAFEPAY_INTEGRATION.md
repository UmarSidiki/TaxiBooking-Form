# MultiSafepay Integration Guide

This document explains how MultiSafepay payment gateway has been integrated into the booking system.

## Features

- Full MultiSafepay payment gateway integration
- Support for multiple payment methods (iDEAL, Bancontact, PayPal, credit cards, etc.)
- Test and Live mode support
- Webhook handling for payment status updates
- Seamless redirect flow for customers

## Configuration

### 1. Admin Dashboard Setup

1. Navigate to **Dashboard → Settings → Payment**
2. Scroll to the **MultiSafepay Configuration** section
3. Enter your **MultiSafepay API Key**
4. Select **Environment** (Test Mode or Live Mode)
5. In the **Accepted Payment Methods** section, check **MultiSafepay**
6. Click **Save All Settings**

### 2. Environment Variables (Optional)

You can also set a base URL for webhooks and redirects:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 3. MultiSafepay Account Setup

1. Create an account at [MultiSafepay](https://www.multisafepay.com/)
2. Get your API key from the MultiSafepay dashboard
3. Configure webhook URL in MultiSafepay dashboard:
   - Webhook URL: `https://yourdomain.com/api/multisafepay-webhook`

## How It Works

### Payment Flow

1. **Customer selects MultiSafepay** as payment method on Step 3
2. **Booking is created** with status "pending"
3. **MultiSafepay order is created** via API
4. **Customer is redirected** to MultiSafepay payment page
5. **Customer completes payment** using their preferred method
6. **Customer is redirected back** to success page
7. **Webhook updates booking** status to "completed"

### API Endpoints

#### Create MultiSafepay Order
- **Endpoint**: `/api/create-multisafepay-order`
- **Method**: POST
- **Purpose**: Creates a payment order with MultiSafepay
- **Returns**: Payment URL for customer redirect

#### MultiSafepay Webhook
- **Endpoint**: `/api/multisafepay-webhook`
- **Method**: POST
- **Purpose**: Receives payment status updates from MultiSafepay
- **Updates**: Booking payment status

### Database Changes

The `Booking` model now includes:
- `multisafepayOrderId`: Stores the MultiSafepay order ID
- `multisafepayTransactionId`: Stores the transaction ID from webhook

### Frontend Components

#### PaymentTab Component
- Added MultiSafepay configuration fields
- API Key input
- Test/Live mode selector

#### Step3Payment Component
- Added MultiSafepay payment method button
- Purple-themed UI for MultiSafepay
- Redirect flow handling

#### useStep3 Hook
- `handleMultisafepayBooking()`: Processes MultiSafepay payments
- Creates booking and initiates payment flow

## Testing

### Test Mode
1. Enable **Test Mode** in settings
2. Use MultiSafepay test API key
3. Use test payment methods provided by MultiSafepay

### Test Cards
Refer to [MultiSafepay Test Documentation](https://docs.multisafepay.com/docs/testing) for test payment methods.

## Supported Payment Methods

When customers choose MultiSafepay, they can pay with:
- iDEAL (Netherlands)
- Bancontact (Belgium)
- PayPal
- Credit/Debit Cards (Visa, Mastercard, Maestro)
- SOFORT
- Giropay
- And many more regional payment methods

## Troubleshooting

### Payment not completing
- Check API key is correct
- Verify webhook URL is configured in MultiSafepay dashboard
- Check MultiSafepay dashboard for transaction status

### Webhook not working
- Ensure webhook URL is publicly accessible
- Check server logs for webhook errors
- Verify MultiSafepay IP whitelist if applicable

### Customer stuck on payment page
- Check redirect URLs are correct
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Check MultiSafepay transaction logs

## Security Notes

- API keys are stored securely in the database
- Never expose API keys in frontend code
- Use HTTPS for all webhook endpoints
- Validate webhook signatures (implement if needed)

## Additional Resources

- [MultiSafepay API Documentation](https://docs.multisafepay.com/)
- [MultiSafepay Dashboard](https://merchant.multisafepay.com/)
- [MultiSafepay Support](https://www.multisafepay.com/support)
