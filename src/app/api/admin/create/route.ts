import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if trying to create an admin when one already exists
    if (role === 'admin' || role === 'superadmin') {
      const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
      if (adminCount > 0) {
        return NextResponse.json(
          { success: false, message: 'An admin user already exists. Only one admin can be created.' },
          { status: 403 }
        );
      }
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