import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import Partner from "@/models/Partner";
import { sendAdminPartnerRegistrationEmail } from "@/controllers/email/AdminPartnerNotification";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, address, city, country } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if partner already exists
    const existingPartner = await Partner.findOne({ email: email.toLowerCase().trim() });

    if (existingPartner) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new partner
    const partner = await Partner.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      country: country?.trim(),
      status: "pending",
      documents: [],
      isActive: true,
    });

    console.log("✅ Partner registered successfully:", partner.email);

    // Send notification email to admin
    try {
      await sendAdminPartnerRegistrationEmail({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        city: partner.city,
        country: partner.country,
      });
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Continue with registration even if email fails
    }

    return NextResponse.json(
      {
        message: "Partner registered successfully",
        partnerId: partner._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in partner registration:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
