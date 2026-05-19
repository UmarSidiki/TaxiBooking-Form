import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { Setting } from '@/models/settings';
import { finalizePaidBooking } from '@/lib/payments/finalize-paid-booking';
import { resolvePublicBaseUrl } from '@/lib/payments/resolve-base-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleWebhook(request);
}

export async function POST(request: NextRequest) {
  return handleWebhook(request);
}

function parseMultisafepayIds(request: NextRequest): {
  transactionid: string | null;
  order_id: string | null;
} {
  const searchParams = request.nextUrl.searchParams;
  let transactionid = searchParams.get('transactionid');
  let order_id =
    searchParams.get('order_id') ||
    searchParams.get('orderid') ||
    searchParams.get('orderId');

  return { transactionid, order_id };
}

async function handleWebhook(request: NextRequest) {
  try {
    let { transactionid, order_id } = parseMultisafepayIds(request);

    if (request.method === 'POST' && (!transactionid || !order_id)) {
      try {
        const body = await request.json();
        transactionid = transactionid || body.transactionid || body.transaction_id || null;
        order_id = order_id || body.order_id || body.orderid || null;
      } catch {
        // ignore empty POST body
      }
    }

    if (!transactionid && !order_id) {
      return NextResponse.json(
        { success: false, message: 'Missing transaction ID or order ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const lookupId = transactionid || order_id;
    console.log(`MultiSafepay webhook received for: ${lookupId}`, {
      transactionid,
      order_id,
    });

    const settings = await Setting.findOne();
    if (!settings?.multisafepayApiKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const baseUrl = resolvePublicBaseUrl(request) || undefined;

    const result = await finalizePaidBooking({
      provider: 'multisafepay',
      transactionId: transactionid || undefined,
      orderId: order_id || undefined,
      baseUrl,
    });

    if (!result.success) {
      if (result.retryable) {
        console.log('MultiSafepay payment not ready yet:', result.message);
        // Return 200 so MSP does not treat transient states as hard failures
        return NextResponse.json({ success: true, message: result.message });
      }

      console.error('MultiSafepay finalize failed:', result.message);
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message?.includes('Pending') ? 404 : 500 }
      );
    }

    console.log('✅ MultiSafepay booking finalized:', result.tripId);
    return new NextResponse('OK', { status: 200 });
  } catch (e: unknown) {
    console.error('Error processing MultiSafepay webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
