import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { User } from "@/features/auth/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { createAdminSchema } from "@/features/auth/schema/password-reset.schema";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, createAdminSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password, name, role } = parsed.data;

    await connectDB();
    const adminCount = await User.countDocuments({
      role: { $in: ["admin", "superadmin"] },
    });

    if (adminCount > 0) {
      const session = await getServerSession(authOptions);
      if (
        !session?.user ||
        (session.user.role !== "admin" && session.user.role !== "superadmin")
      ) {
        return jsonError("forbidden", 403);
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return jsonError("conflict", 409);

    const user = await User.create({
      email: email.toLowerCase(),
      password: await hash(password, 10),
      name,
      role,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return jsonError("internal_error", 500);
  }
}
