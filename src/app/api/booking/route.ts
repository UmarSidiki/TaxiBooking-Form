import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/controllers/email/OrderConfirmation";
import { sendOrderNotificationEmail } from "@/controllers/email/OrderNotification";
import { getMongoDb } from "@/lib/mongodb";
import { Booking, BookingInput } from "@/models/Booking";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/mongoose";
import Vehicle from "@/models/Vehicle";

export async function POST(request: NextRequest) {
  try {
    const formData: BookingInput = await request.json();

    // Validate required fields
    if (!formData.pickup || !formData.dropoff || !formData.date || !formData.time) {
      return NextResponse.json(
        { success: false, message: "Missing required trip details" },
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
    let totalAmount = vehicle.price;
    
    // If we have distance data, calculate distance-based pricing
    if (formData.pickup && formData.dropoff) {
      try {
        const distanceResponse = await fetch(`${request.nextUrl.origin}/api/distance`, {
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
            totalAmount = vehicle.price + distancePrice;
            
            // Apply minimum fare
            totalAmount = Math.max(totalAmount, vehicle.minimumFare);
          }
        }
      } catch (error) {
        console.error("Error calculating distance for pricing:", error);
        // Fallback to base price if distance calculation fails
      }
    }
    
    const childSeatsCost = formData.childSeats * 10;
    const babySeatsCost = formData.babySeats * 10;
    totalAmount += childSeatsCost + babySeatsCost;

    // Generate unique trip ID
    const tripId = uuidv4();

    // Create booking object
    const booking: Omit<Booking, "_id"> = {
      tripId,
      pickup: formData.pickup,
      dropoff: formData.dropoff,
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
      paymentStatus: "completed",
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const db = await getMongoDb();
    const result = await db.collection<Booking>("bookings").insertOne(booking as Booking);

    if (!result.insertedId) {
      throw new Error("Failed to save booking to database");
    }

    // Send emails
    const emailData = {
      tripId,
      pickup: formData.pickup,
      dropoff: formData.dropoff,
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
      totalAmount,
    };

    await Promise.all([
      sendOrderConfirmationEmail(emailData),
      sendOrderNotificationEmail(emailData),
    ]);

    return NextResponse.json({
      success: true,
      message: "Booking confirmed and emails sent",
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