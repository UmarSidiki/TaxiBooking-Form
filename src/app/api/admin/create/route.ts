import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from '@/lib/database';
import { User } from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'admin' } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if any admin already exists
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    
    // If admins exist, require authentication
    if (adminCount > 0) {
      const session = await getServerSession(authOptions);
      
      // If user is not authenticated or not an admin, deny request
      if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Only existing admins can create new admin users' },
          { status: 403 }
        );
      }
    }
    // If no admins exist, allow first-time setup without authentication

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `${role} user created successfully`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}