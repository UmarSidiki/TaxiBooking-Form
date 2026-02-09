import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { sendAdminPartnerRegistrationEmail } from "@/controllers/email/admin";
import { isValidEmail, isValidPhone, sanitizeInput } from "@/lib/validation";

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

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
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

    // Sanitize text inputs
    const sanitizedName = sanitizeInput(name.trim());
    const sanitizedAddress = address ? sanitizeInput(address.trim()) : undefined;
    const sanitizedCity = city ? sanitizeInput(city.trim()) : undefined;
    const sanitizedCountry = country ? sanitizeInput(country.trim()) : undefined;

    // Create new partner
    const partner = await Partner.create({
      name: sanitizedName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim(),
      address: sanitizedAddress,
      city: sanitizedCity,
      country: sanitizedCountry,
      status: "pending",
      documents: [],
      isActive: true,
    });

    // Get base URL from request
    const baseUrl = request.headers.get('origin') || 
                    request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                    process.env.NEXT_PUBLIC_BASE_URL;

    // Send notification email to admin
    try {
      await sendAdminPartnerRegistrationEmail({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        city: partner.city,
        country: partner.country,
        baseUrl: baseUrl,
      });
    } catch (emailError) {
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
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
