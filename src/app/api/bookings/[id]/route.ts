import { NextRequest, NextResponse } from "next/server";
import { Booking, type IBooking } from "@/models/booking";
import Stripe from "stripe";
import { Setting } from "@/models/settings";
import { connectDB } from "@/lib/database";
import { sendOrderCancellationEmail } from "@/controllers/email/bookings";
import { sendRideAssignmentEmail } from "@/controllers/email/bookings";
import { sendRideCancellationEmail } from "@/controllers/email/bookings";
import { Driver } from "@/models/driver";
import { Partner } from "@/models/partner";
import { notifyEligiblePartners } from "@/lib/partners/notify-eligible-partners";

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
    stops: booking.stops || [],
    tripType: booking.tripType,
    date: booking.date,
    time: booking.time,
    returnDate: booking.returnDate,
    returnTime: booking.returnTime,
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

    const supportedActions = new Set([
      "cancel",
      "complete",
      "assign",
      "assignpartner",
      "approvepartner",
    ]);
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

    // Check if this is a reassignment (for email sending)
    const isReassignment = rawAction === "assign" && booking.assignedDriver && booking.assignedDriver._id !== body.driverId;
    const isPartnerReassignment = rawAction === "assignpartner" && booking.assignedPartner && booking.assignedPartner._id !== body.partnerId;

    // Handle different actions
    if (rawAction === "cancel") {
      console.log("PATCH booking - Cancel action for booking ID:", id);
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
      console.log("PATCH booking - Complete action for booking ID:", id);
      updateData.status = 'completed';
    } else if (rawAction === "assign") {
      const driverId = body.driverId;
      if (!driverId) {
        return NextResponse.json(
          { success: false, message: "Driver ID is required for assignment" },
          { status: 400 }
        );
      }

      // Fetch driver details
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return NextResponse.json(
          { success: false, message: "Driver not found" },
          { status: 404 }
        );
      }

      updateData.assignedDriver = {
        _id: driver._id.toString(),
        name: driver.name,
        email: driver.email,
      };

      // Reset assignment email sent flag for new assignment
      updateData.assignmentEmailSent = false;
    } else if (rawAction === "assignpartner") {
      const partnerId = body.partnerId;
      if (!partnerId) {
        return NextResponse.json(
          { success: false, message: "Partner ID is required for assignment" },
          { status: 400 }
        );
      }

      // Fetch partner details
      const partner = await Partner.findById(partnerId);
      if (!partner) {
        return NextResponse.json(
          { success: false, message: "Partner not found" },
          { status: 404 }
        );
      }

      // Check if partner is approved
      if (partner.status !== "approved") {
        return NextResponse.json(
          { success: false, message: "Partner must be approved to receive assignments" },
          { status: 400 }
        );
      }

      if (booking.paymentMethod !== "cash" && booking.partnerReviewStatus !== "approved") {
        return NextResponse.json(
          { success: false, message: "Approve the booking for partners before assignment" },
          { status: 400 }
        );
      }

      updateData.assignedPartner = {
        _id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
      };

      // Reset assignment email sent flag for new assignment
      updateData.assignmentEmailSent = false;
    } else if (rawAction === "approvepartner") {
      if (!booking.totalAmount || Number.isNaN(Number(booking.totalAmount))) {
        return NextResponse.json(
          { success: false, message: "Booking total amount is missing" },
          { status: 400 }
        );
      }

      const settings = await Setting.findOne();
      if (!settings?.enablePartners) {
        return NextResponse.json(
          { success: false, message: "Partner marketplace is disabled" },
          { status: 400 }
        );
      }

      if (booking.paymentMethod === "cash") {
        return NextResponse.json(
          { success: false, message: "Cash bookings cannot be approved for partners" },
          { status: 400 }
        );
      }

      const submittedMargin =
        body.marginPercentage !== undefined ? Number(body.marginPercentage) : 0;

      if (Number.isNaN(submittedMargin) || submittedMargin < 0 || submittedMargin > 100) {
        return NextResponse.json(
          { success: false, message: "Margin percentage must be between 0 and 100" },
          { status: 400 }
        );
      }

      const totalAmount = typeof booking.totalAmount === "number" ? booking.totalAmount : Number(booking.totalAmount);
      const marginAmount = Number(((totalAmount * submittedMargin) / 100).toFixed(2));
      const partnerPayout = Number((totalAmount - marginAmount).toFixed(2));

      updateData.partnerMarginPercentage = submittedMargin;
      updateData.partnerMarginAmount = marginAmount;
      updateData.partnerPayoutAmount = partnerPayout;
      updateData.partnerReviewStatus = "approved";
      updateData.partnerApprovedAt = new Date();
      updateData.availableForPartners = false; // will be flipped after notifications
      updateData.partnerNotificationSent = false;
    }

    // Update booking
    console.log("PATCH booking - Updating booking with data:", updateData);
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      console.log("PATCH booking - Failed to update booking");
      return NextResponse.json(
        { success: false, message: "Failed to update booking" },
        { status: 500 }
      );
    }

    console.log("PATCH booking - Booking updated successfully. New status:", updatedBooking.status);

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

    // Send cancellation email to old partner if this is a partner reassignment
    if (rawAction === "assignpartner" && isPartnerReassignment && booking.assignedPartner) {
      try {
        const cancellationPayload = {
          tripId: updatedBooking.tripId,
          pickup: updatedBooking.pickup,
          dropoff: updatedBooking.dropoff || 'N/A',
          stops: updatedBooking.stops || [],
          tripType: updatedBooking.tripType,
          date: updatedBooking.date,
          time: updatedBooking.time,
          returnDate: updatedBooking.returnDate,
          returnTime: updatedBooking.returnTime,
          passengers: updatedBooking.passengers,
          selectedVehicle: updatedBooking.selectedVehicle,
          vehicleDetails: updatedBooking.vehicleDetails || { name: 'N/A', price: '0', seats: '4' },
          childSeats: updatedBooking.childSeats,
          babySeats: updatedBooking.babySeats,
          notes: updatedBooking.notes,
          firstName: updatedBooking.firstName,
          lastName: updatedBooking.lastName,
          email: updatedBooking.email,
          phone: updatedBooking.phone,
          totalAmount: typeof updatedBooking.totalAmount === "number" ? updatedBooking.totalAmount : 0,
          paymentMethod: updatedBooking.paymentMethod,
          paymentStatus: updatedBooking.paymentStatus,
          flightNumber: updatedBooking.flightNumber,
          driverName: booking.assignedPartner.name,
          driverEmail: booking.assignedPartner.email,
        };

        const emailSent = await sendRideCancellationEmail(cancellationPayload);

        if (!emailSent) {
          console.error("Failed to send cancellation email to old partner:", booking.assignedPartner.email);
        }
      } catch (emailError) {
        console.error("Error sending cancellation email to old partner:", emailError);
        // Continue with the response even if email fails
      }
    }

    // Send cancellation email to old driver if this is a reassignment
    if (rawAction === "assign" && isReassignment && booking.assignedDriver) {
      try {
        const cancellationPayload = {
          tripId: updatedBooking.tripId,
          pickup: updatedBooking.pickup,
          dropoff: updatedBooking.dropoff || 'N/A',
          stops: updatedBooking.stops || [],
          tripType: updatedBooking.tripType,
          date: updatedBooking.date,
          time: updatedBooking.time,
          returnDate: updatedBooking.returnDate,
          returnTime: updatedBooking.returnTime,
          passengers: updatedBooking.passengers,
          selectedVehicle: updatedBooking.selectedVehicle,
          vehicleDetails: updatedBooking.vehicleDetails || { name: 'N/A', price: '0', seats: '4' },
          childSeats: updatedBooking.childSeats,
          babySeats: updatedBooking.babySeats,
          notes: updatedBooking.notes,
          firstName: updatedBooking.firstName,
          lastName: updatedBooking.lastName,
          email: updatedBooking.email,
          phone: updatedBooking.phone,
          totalAmount: typeof updatedBooking.totalAmount === "number" ? updatedBooking.totalAmount : 0,
          paymentMethod: updatedBooking.paymentMethod,
          paymentStatus: updatedBooking.paymentStatus,
          flightNumber: updatedBooking.flightNumber,
          driverName: booking.assignedDriver.name,
          driverEmail: booking.assignedDriver.email,
        };

        const emailSent = await sendRideCancellationEmail(cancellationPayload);

        if (!emailSent) {
          console.error("Failed to send cancellation email to old driver:", booking.assignedDriver.email);
        }
      } catch (emailError) {
        console.error("Error sending cancellation email to old driver:", emailError);
        // Continue with the response even if email fails
      }
    }

    // Send assignment email to partner if applicable
    if (rawAction === "assignpartner" && updatedBooking.assignedPartner && !updatedBooking.assignmentEmailSent) {
      try {
        const assignmentPayload = {
          tripId: updatedBooking.tripId,
          pickup: updatedBooking.pickup,
          dropoff: updatedBooking.dropoff || 'N/A',
          stops: updatedBooking.stops || [],
          tripType: updatedBooking.tripType,
          date: updatedBooking.date,
          time: updatedBooking.time,
          returnDate: updatedBooking.returnDate,
          returnTime: updatedBooking.returnTime,
          passengers: updatedBooking.passengers,
          selectedVehicle: updatedBooking.selectedVehicle,
          vehicleDetails: updatedBooking.vehicleDetails || { name: 'N/A', price: '0', seats: '4' },
          childSeats: updatedBooking.childSeats,
          babySeats: updatedBooking.babySeats,
          notes: updatedBooking.notes,
          firstName: updatedBooking.firstName,
          lastName: updatedBooking.lastName,
          email: updatedBooking.email,
          phone: updatedBooking.phone,
          totalAmount:
            typeof updatedBooking.partnerPayoutAmount === "number"
              ? updatedBooking.partnerPayoutAmount
              : typeof updatedBooking.totalAmount === "number"
              ? updatedBooking.totalAmount
              : 0,
          paymentMethod: updatedBooking.paymentMethod,
          paymentStatus: updatedBooking.paymentStatus,
          flightNumber: updatedBooking.flightNumber,
          driverName: updatedBooking.assignedPartner.name,
          driverEmail: updatedBooking.assignedPartner.email,
        };

        const emailSent = await sendRideAssignmentEmail(assignmentPayload);

        if (emailSent) {
          // Mark that assignment email was sent
          await Booking.findByIdAndUpdate(id, { assignmentEmailSent: true });
        } else {
          console.error("Failed to send assignment email to:", updatedBooking.assignedPartner.email);
        }
      } catch (emailError) {
        console.error("Error sending assignment email:", emailError);
        // Continue with the response even if email fails
      }
    }

    // Send assignment email if applicable
    if (rawAction === "assign" && updatedBooking.assignedDriver && !updatedBooking.assignmentEmailSent) {
      try {
        const assignmentPayload = {
          tripId: updatedBooking.tripId,
          pickup: updatedBooking.pickup,
          dropoff: updatedBooking.dropoff || 'N/A',
          stops: updatedBooking.stops || [],
          tripType: updatedBooking.tripType,
          date: updatedBooking.date,
          time: updatedBooking.time,
          returnDate: updatedBooking.returnDate,
          returnTime: updatedBooking.returnTime,
          passengers: updatedBooking.passengers,
          selectedVehicle: updatedBooking.selectedVehicle,
          vehicleDetails: updatedBooking.vehicleDetails || { name: 'N/A', price: '0', seats: '4' },
          childSeats: updatedBooking.childSeats,
          babySeats: updatedBooking.babySeats,
          notes: updatedBooking.notes,
          firstName: updatedBooking.firstName,
          lastName: updatedBooking.lastName,
          email: updatedBooking.email,
          phone: updatedBooking.phone,
          totalAmount: typeof updatedBooking.totalAmount === "number" ? updatedBooking.totalAmount : 0,
          paymentMethod: updatedBooking.paymentMethod,
          paymentStatus: updatedBooking.paymentStatus,
          flightNumber: updatedBooking.flightNumber,
          driverName: updatedBooking.assignedDriver.name,
          driverEmail: updatedBooking.assignedDriver.email,
        };

        const emailSent = await sendRideAssignmentEmail(assignmentPayload);

        if (emailSent) {
          // Mark that assignment email was sent
          await Booking.findByIdAndUpdate(id, { assignmentEmailSent: true });
        } else {
          console.error("Failed to send assignment email to:", updatedBooking.assignedDriver.email);
        }
      } catch (emailError) {
        console.error("Error sending assignment email:", emailError);
        // Continue with the response even if email fails
      }
    }

    if (rawAction === "approvepartner") {
      const bookingForNotification = await Booking.findById(updatedBooking._id);
      const baseUrl =
        request.headers.get("origin") ||
        request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
        process.env.NEXT_PUBLIC_BASE_URL;

      if (bookingForNotification) {
        await notifyEligiblePartners(bookingForNotification, baseUrl);
      }
    }

    if (
      rawAction === "complete" &&
      booking.status !== "completed" &&
      updatedBooking.assignedPartner?._id
    ) {
      console.log("PATCH booking - Partner earnings update triggered", {
        bookingId: id,
        partnerId: updatedBooking.assignedPartner._id,
        bookingStatus: booking.status,
      });

      const partnerAmount =
        typeof updatedBooking.partnerPayoutAmount === "number"
          ? updatedBooking.partnerPayoutAmount
          : typeof updatedBooking.totalAmount === "number"
          ? updatedBooking.totalAmount
          : 0;

      const isCashBooking = updatedBooking.paymentMethod === "cash";
      const isPaymentComplete =
        isCashBooking || updatedBooking.paymentStatus === "completed";

      console.log("PATCH booking - Partner earnings details", {
        partnerAmount,
        isCashBooking,
        paymentStatus: updatedBooking.paymentStatus,
        isPaymentComplete,
      });

      if (partnerAmount > 0 && isPaymentComplete) {
        const incPayload: Record<string, number> = {
          totalEarnings: partnerAmount,
        };

        if (isCashBooking) {
          incPayload.cashEarnings = partnerAmount;
        } else {
          incPayload.onlineEarnings = partnerAmount;
          incPayload.payoutBalance = partnerAmount;
        }

        console.log("PATCH booking - Incrementing partner with payload:", incPayload);

        try {
          const updatedPartner = await Partner.findByIdAndUpdate(updatedBooking.assignedPartner._id, {
            $inc: incPayload,
          }, { new: true });
          console.log("PATCH booking - Partner earnings updated successfully", {
            partnerId: updatedBooking.assignedPartner._id,
            payoutBalance: updatedPartner?.payoutBalance,
            onlineEarnings: updatedPartner?.onlineEarnings,
            cashEarnings: updatedPartner?.cashEarnings,
          });
        } catch (partnerUpdateError) {
          console.error("PATCH booking - Failed to update partner earnings", {
            error: partnerUpdateError,
            partnerId: updatedBooking.assignedPartner._id,
          });
        }
      } else {
        console.log("PATCH booking - Skipping partner update - conditions not met", {
          partnerAmount,
          isPaymentComplete,
          hasPartner: !!updatedBooking.assignedPartner?._id,
        });
      }
    } else {
      console.log("PATCH booking - Skipping partner earnings update", {
        isComplete: rawAction === "complete",
        bookingWasNotCompleted: booking.status !== "completed",
        hasPartner: !!updatedBooking.assignedPartner?._id,
        rawAction,
        bookingStatus: booking.status,
      });
    }

    const actionPastTense =
      rawAction === "cancel"
        ? "canceled"
        : rawAction === "approvepartner"
        ? "approved for partners"
        : "completed";

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