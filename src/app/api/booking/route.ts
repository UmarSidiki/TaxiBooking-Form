import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/controllers/email/OrderConfirmation";
import { sendOrderNotificationEmail } from "@/controllers/email/OrderNotification";
import Booking, { BookingInput } from "@/models/Booking";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/mongoose";
import Vehicle, { IVehicle } from "@/models/Vehicle";

// Helper function to calculate booking total
async function calculateBookingTotal(
  formData: BookingInput,
  vehicle: IVehicle,
  baseUrl: string
): Promise<number> {
  let totalAmount = 0;

  if (formData.bookingType === 'hourly') {
    // Hourly booking calculation
    const pricePerHour = vehicle.pricePerHour || 30;
    const minimumHours = vehicle.minimumHours || 2;
    const hours = Math.max(formData.duration || 2, minimumHours);
    totalAmount = pricePerHour * hours;
  } else {
    // Destination-based booking
    totalAmount = vehicle.price;

    // If we have distance data, calculate distance-based pricing
    if (formData.pickup && formData.dropoff) {
      try {
        const distanceResponse = await fetch(`${baseUrl}/api/distance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: formData.pickup,
            destination: formData.dropoff
          }),
        });

        if (distanceResponse.ok) {
          const distanceData = await distanceResponse.json();
          if (distanceData.success) {
            const distanceKm = distanceData.data.distance.km;
            const distancePrice = vehicle.pricePerKm * distanceKm;
            let oneWayPrice = vehicle.price + distancePrice;

            // Apply minimum fare
            oneWayPrice = Math.max(oneWayPrice, vehicle.minimumFare);

            // For roundtrip, add the return percentage
            if (formData.tripType === 'roundtrip') {
              const returnPercentage = vehicle.returnPricePercentage || 100;
              totalAmount = oneWayPrice + (oneWayPrice * (returnPercentage / 100));
            } else {
              totalAmount = oneWayPrice;
            }
          }
        }
      } catch (error) {
        console.error("Error calculating distance for pricing:", error);
        // Fallback to base price if distance calculation fails
        totalAmount = vehicle.price;
      }
    }
  }

  const childSeatsCost = formData.childSeats * (vehicle.childSeatPrice || 10);
  const babySeatsCost = formData.babySeats * (vehicle.babySeatPrice || 10);
  totalAmount += childSeatsCost + babySeatsCost;

  return totalAmount;
}

// Helper function to create email data
function createEmailData(
  formData: BookingInput,
  vehicle: IVehicle,
  tripId: string,
  totalAmount: number
) {
  return {
    tripId,
    pickup: formData.pickup,
    dropoff: formData.dropoff || 'N/A (Hourly booking)',
    tripType: formData.tripType,
    date: formData.date,
    time: formData.time,
    passengers: formData.passengers,
    selectedVehicle: formData.selectedVehicle,
    vehicleDetails: {
      name: vehicle.name,
      price: `€${vehicle.price}`,
      seats: `${vehicle.persons} persons`,
    },
    childSeats: formData.childSeats,
    babySeats: formData.babySeats,
    notes: formData.notes,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    totalAmount: formData.totalAmount || totalAmount,
    paymentMethod: formData.paymentMethod,
    paymentStatus: formData.paymentStatus,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData: BookingInput = await request.json();

    // Validate required fields
    if (!formData.pickup || !formData.date || !formData.time) {
      return NextResponse.json(
        { success: false, message: "Missing required trip details" },
        { status: 400 }
      );
    }
    
    // Dropoff is required for destination bookings, optional for hourly
    if (formData.bookingType === 'destination' && !formData.dropoff) {
      return NextResponse.json(
        { success: false, message: "Dropoff location is required for destination bookings" },
        { status: 400 }
      );
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return NextResponse.json(
        { success: false, message: "Missing required personal details" },
        { status: 400 }
      );
    }

    if (!formData.selectedVehicle) {
      return NextResponse.json(
        { success: false, message: "Please select a vehicle" },
        { status: 400 }
      );
    }

    // Fetch vehicle details from database
    await connectDB();
    const vehicle = await Vehicle.findById(formData.selectedVehicle);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Selected vehicle not found" },
        { status: 404 }
      );
    }

    if (!vehicle.isActive) {
      return NextResponse.json(
        { success: false, message: "Selected vehicle is not available" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = await calculateBookingTotal(formData, vehicle, request.nextUrl.origin);

    // Generate unique trip ID
    const tripId = uuidv4();

    // Create booking object
    const bookingData = {
      tripId,
      pickup: formData.pickup,
      dropoff: formData.dropoff || '',
      tripType: formData.tripType,
      date: formData.date,
      time: formData.time,
      passengers: formData.passengers,
      selectedVehicle: formData.selectedVehicle,
      vehicleDetails: {
        name: vehicle.name,
        price: `€${vehicle.price}`,
        seats: `${vehicle.persons} persons`,
      },
      childSeats: formData.childSeats,
      babySeats: formData.babySeats,
      notes: formData.notes,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      paymentMethod: formData.paymentMethod || 'stripe',
      paymentStatus: (formData.paymentStatus as "pending" | "completed" | "failed" | "refunded") || 'completed',
      stripePaymentIntentId: formData.stripePaymentIntentId,
      status: 'upcoming',
      totalAmount: formData.totalAmount || totalAmount,
    };

    // Save to database using Mongoose
    await Booking.create(bookingData);

    // Send emails - NOW PROPERLY AWAITED
    const emailData = createEmailData(formData, vehicle, tripId, totalAmount);
    
    try {
      console.log("📧 Sending confirmation email to:", emailData.email);
      const confirmationEmailSent = await sendOrderConfirmationEmail(emailData);
      
      if (!confirmationEmailSent) {
        console.error("❌ Failed to send confirmation email to:", emailData.email);
      }
      
      console.log("📧 Sending notification email to admin");
      const notificationEmailSent = await sendOrderNotificationEmail(emailData);
      
      if (!notificationEmailSent) {
        console.error("❌ Failed to send notification email to admin");
      }
    } catch (emailError) {
      console.error("❌ Error sending booking emails:", emailError);
      // Continue with the response even if emails fail
    }

    return NextResponse.json({
      success: true,
      message: "Booking confirmed",
      tripId,
      totalAmount,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Booking failed",
      },
      { status: 500 }
    );
  }
}