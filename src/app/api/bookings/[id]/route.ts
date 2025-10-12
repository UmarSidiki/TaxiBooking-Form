import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import Setting from "@/models/Setting";
import { connectDB } from "@/lib/mongoose";
import { sendOrderCancellationEmail } from "@/controllers/email/OrderCancellation";

// GET single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getMongoDb();
    const collection = db.collection<Booking>("bookings");
    
    const booking = await collection.findOne({ _id: new ObjectId(id) });
    
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
    
    const db = await getMongoDb();
    const collection = db.collection<Booking>("bookings");
    
    // Fetch the booking
    const booking = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }
    
    const updateData: Partial<Booking> = {
      updatedAt: new Date(),
    };
    
    // Handle different actions
    if (rawAction === "cancel") {
      updateData.status = 'canceled';
      updateData.canceledAt = new Date();
      
      // Handle refund if payment was completed and via Stripe
      if (
        booking.paymentStatus === 'completed' && 
        booking.paymentMethod === 'stripe' &&
        booking.stripePaymentIntentId
      ) {
        try {
          // Get Stripe configuration
          await connectDB();
          const settings = await Setting.findOne();
          const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

          if (!stripeSecretKey) {
            return NextResponse.json(
              { success: false, message: "Stripe is not configured. Cannot process refund." },
              { status: 500 }
            );
          }

          const stripeApiVersion =
            (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion);

          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: stripeApiVersion,
          });

          const paymentIntent = (await stripe.paymentIntents.retrieve(
            booking.stripePaymentIntentId,
            { expand: ["latest_charge"] }
          )) as Stripe.PaymentIntent;

          const percentage =
            normalizedRefundPercentage !== undefined ? normalizedRefundPercentage : 100;
          const baseAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
          const refundAmount = baseAmount * (percentage / 100);
          const refundAmountCents = Math.round(refundAmount * 100);

          if (refundAmountCents <= 0) {
            return NextResponse.json(
              { success: false, message: "Refund amount must be greater than zero" },
              { status: 400 }
            );
          }

          const latestCharge = paymentIntent.latest_charge;
          const chargeObject =
            latestCharge && typeof latestCharge !== "string" ? latestCharge : undefined;
          const amountReceivedCents =
            paymentIntent.amount_received ?? chargeObject?.amount ?? paymentIntent.amount ?? 0;
          const amountAlreadyRefundedCents = chargeObject?.amount_refunded ?? 0;
          const refundableCents = Math.max(amountReceivedCents - amountAlreadyRefundedCents, 0);

          if (refundableCents <= 0) {
            return NextResponse.json(
              { success: false, message: "No refundable amount remains for this payment" },
              { status: 400 }
            );
          }

          const amountToRefundCents = Math.min(refundAmountCents, refundableCents);

          if (amountToRefundCents <= 0) {
            return NextResponse.json(
              { success: false, message: "Calculated refund is zero" },
              { status: 400 }
            );
          }

          // Process refund with Stripe
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId,
            amount: amountToRefundCents,
            reason: 'requested_by_customer',
            metadata: {
              booking_id: id,
              trip_id: booking.tripId,
              refund_percentage: percentage.toString(),
            },
          });

          if (refund.status === 'succeeded' || refund.status === 'pending') {
            updateData.refundPercentage = percentage;
            updateData.refundAmount = amountToRefundCents / 100;
            updateData.paymentStatus = 'refunded';
          } else {
            return NextResponse.json(
              { success: false, message: `Refund failed with status: ${refund.status}` },
              { status: 500 }
            );
          }
        } catch (stripeError: unknown) {
          console.error("Stripe refund error:", stripeError);
          const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
          return NextResponse.json(
            { 
              success: false, 
              message: `Failed to process refund: ${errorMessage}` 
            },
            { status: 500 }
          );
        }
      } else if (
        booking.paymentStatus === 'completed' && 
        booking.paymentMethod === 'bank_transfer'
      ) {
        // For bank transfers, just mark the refund in the system
        const percentage =
          normalizedRefundPercentage !== undefined ? normalizedRefundPercentage : 100;
        const baseAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
        const refundAmount = baseAmount * (percentage / 100);
        
        updateData.refundPercentage = percentage;
        updateData.refundAmount = refundAmount;
        updateData.paymentStatus = 'refunded';
      }
    } else if (rawAction === "complete") {
      updateData.status = 'completed';
    }
    
    // Update booking
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update booking" },
        { status: 500 }
      );
    }
    
    // Fetch updated booking
    const updatedBooking = await collection.findOne({ _id: new ObjectId(id) });
    
    if (rawAction === "cancel" && updatedBooking?.email) {
      const cancellationPayload = {
        tripId: updatedBooking.tripId,
        pickup: updatedBooking.pickup,
        dropoff: updatedBooking.dropoff || 'N/A (Hourly booking)',
        tripType: updatedBooking.tripType,
        date: updatedBooking.date,
        time: updatedBooking.time,
        passengers: updatedBooking.passengers,
        selectedVehicle: updatedBooking.selectedVehicle,
        vehicleDetails: updatedBooking.vehicleDetails,
        childSeats: updatedBooking.childSeats,
        babySeats: updatedBooking.babySeats,
        notes: updatedBooking.notes,
        firstName: updatedBooking.firstName,
        lastName: updatedBooking.lastName,
        email: updatedBooking.email,
        phone: updatedBooking.phone,
        totalAmount: typeof updatedBooking.totalAmount === "number" ? updatedBooking.totalAmount : 0,
        refundAmount:
          typeof updateData.refundAmount === "number"
            ? updateData.refundAmount
            : updatedBooking.refundAmount || 0,
        refundPercentage:
          typeof updateData.refundPercentage === "number"
            ? updateData.refundPercentage
            : updatedBooking.refundPercentage,
        paymentMethod: updatedBooking.paymentMethod,
        paymentStatus: updatedBooking.paymentStatus,
        canceledAt: updateData.canceledAt ?? updatedBooking.canceledAt,
      };

      sendOrderCancellationEmail(cancellationPayload).catch((emailError) => {
        console.error("Error sending cancellation email:", emailError);
      });
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
    const { id } = await params;
    const db = await getMongoDb();
    const collection = db.collection<Booking>("bookings");
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
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
