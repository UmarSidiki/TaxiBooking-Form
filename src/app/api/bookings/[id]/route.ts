import { NextRequest, NextResponse } from "next/server";
import Booking, { IBooking } from "@/models/Booking";
import Stripe from "stripe";
import Setting from "@/models/Setting";
import { connectDB } from "@/lib/mongoose";
import { sendOrderCancellationEmail } from "@/controllers/email/OrderCancellation";

// Helper function to process Stripe refund
async function processStripeRefund(
  booking: IBooking,
  refundPercentage: number,
  settings: { stripeSecretKey?: string } | null
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  try {
    if (!booking.stripePaymentIntentId) {
      return { success: false, error: "No payment intent ID found for refund" };
    }

    const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return { success: false, error: "Stripe is not configured. Cannot process refund." };
    }

    const stripeApiVersion = (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });

    const paymentIntent = (await stripe.paymentIntents.retrieve(
      booking.stripePaymentIntentId,
      { expand: ["latest_charge"] }
    )) as Stripe.PaymentIntent;

    const baseAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
    const refundAmount = baseAmount * (refundPercentage / 100);
    const refundAmountCents = Math.round(refundAmount * 100);

    if (refundAmountCents <= 0) {
      return { success: false, error: "Refund amount must be greater than zero" };
    }

    const latestCharge = paymentIntent.latest_charge;
    const chargeObject = latestCharge && typeof latestCharge !== "string" ? latestCharge : undefined;
    const amountReceivedCents = paymentIntent.amount_received ?? chargeObject?.amount ?? paymentIntent.amount ?? 0;
    const amountAlreadyRefundedCents = chargeObject?.amount_refunded ?? 0;
    const refundableCents = Math.max(amountReceivedCents - amountAlreadyRefundedCents, 0);

    if (refundableCents <= 0) {
      return { success: false, error: "No refundable amount remains for this payment" };
    }

    const amountToRefundCents = Math.min(refundAmountCents, refundableCents);

    if (amountToRefundCents <= 0) {
      return { success: false, error: "Calculated refund is zero" };
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: amountToRefundCents,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: booking.id,
        trip_id: booking.tripId,
        refund_percentage: refundPercentage.toString(),
      },
    });

    if (refund.status === 'succeeded' || refund.status === 'pending') {
      return { success: true, refundAmount: amountToRefundCents / 100 };
    } else {
      return { success: false, error: `Refund failed with status: ${refund.status}` };
    }
  } catch (stripeError: unknown) {
    console.error("Stripe refund error:", stripeError);
    const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
    return { success: false, error: `Failed to process refund: ${errorMessage}` };
  }
}

// GET single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch booking",
      },
      { status: 500 }
    );
  }
}

// Helper function to create cancellation email data
function createCancellationEmailData(booking: IBooking, updateData: Partial<IBooking>) {
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff || 'N/A (Hourly booking)',
    tripType: booking.tripType,
    date: booking.date,
    time: booking.time,
    passengers: booking.passengers,
    selectedVehicle: booking.selectedVehicle,
    vehicleDetails: booking.vehicleDetails,
    childSeats: booking.childSeats,
    babySeats: booking.babySeats,
    notes: booking.notes,
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: booking.phone,
    totalAmount: typeof booking.totalAmount === "number" ? booking.totalAmount : 0,
    refundAmount: typeof updateData.refundAmount === "number" ? updateData.refundAmount : booking.refundAmount || 0,
    refundPercentage: typeof updateData.refundPercentage === "number" ? updateData.refundPercentage : booking.refundPercentage,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    canceledAt: updateData.canceledAt ?? booking.canceledAt,
  };
}

// PATCH update booking (cancel, refund, complete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const rawAction = typeof body.action === "string" ? body.action.toLowerCase() : undefined;
    const normalizedRefundPercentage =
      body.refundPercentage !== undefined
        ? Number(body.refundPercentage)
        : undefined;

    if (!rawAction) {
      return NextResponse.json(
        { success: false, message: "Action is required" },
        { status: 400 }
      );
    }

    const supportedActions = new Set(["cancel", "complete"]);
    if (!supportedActions.has(rawAction)) {
      return NextResponse.json(
        { success: false, message: `Unsupported action: ${rawAction}` },
        { status: 400 }
      );
    }

    if (
      normalizedRefundPercentage !== undefined &&
      (Number.isNaN(normalizedRefundPercentage) ||
        normalizedRefundPercentage < 0 ||
        normalizedRefundPercentage > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Refund percentage must be a number between 0 and 100",
        },
        { status: 400 }
      );
    }
    
    // Fetch the booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }
    
    const updateData: Partial<IBooking> = {
      updatedAt: new Date(),
    };
    
    // Handle different actions
    if (rawAction === "cancel") {
      updateData.status = 'canceled';
      updateData.canceledAt = new Date();

      // Handle refund if payment was completed
      if (booking.paymentStatus === 'completed') {
        if (booking.paymentMethod === 'stripe' && booking.stripePaymentIntentId) {
          // Process Stripe refund
          const settings = await Setting.findOne();
          const refundResult = await processStripeRefund(booking, normalizedRefundPercentage ?? 100, settings);

          if (!refundResult.success) {
            return NextResponse.json(
              { success: false, message: refundResult.error },
              { status: 500 }
            );
          }

          updateData.refundPercentage = normalizedRefundPercentage ?? 100;
          updateData.refundAmount = refundResult.refundAmount;
          updateData.paymentStatus = 'refunded';
        } else if (booking.paymentMethod === 'bank_transfer') {
          // For bank transfers, just mark the refund in the system
          const percentage = normalizedRefundPercentage ?? 100;
          const baseAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
          const refundAmount = baseAmount * (percentage / 100);

          updateData.refundPercentage = percentage;
          updateData.refundAmount = refundAmount;
          updateData.paymentStatus = 'refunded';
        }
      }
    } else if (rawAction === "complete") {
      updateData.status = 'completed';
    }
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return NextResponse.json(
        { success: false, message: "Failed to update booking" },
        { status: 500 }
      );
    }
    
    // Send cancellation email if applicable - NOW PROPERLY AWAITED
    if (rawAction === "cancel" && updatedBooking.email) {
      try {
        const cancellationPayload = createCancellationEmailData(updatedBooking, updateData);
        const emailSent = await sendOrderCancellationEmail(cancellationPayload);
        
        if (!emailSent) {
          console.error("Failed to send cancellation email to:", updatedBooking.email);
          // Continue with the response even if email fails
        }
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
        // Continue with the response even if email fails
      }
    }

    const actionPastTense = rawAction === "cancel" ? "canceled" : "completed";

    return NextResponse.json({
      success: true,
      message: `Booking ${actionPastTense} successfully`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update booking",
      },
      { status: 500 }
    );
  }
}

// DELETE booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedBooking = await Booking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete booking",
      },
      { status: 500 }
    );
  }
}