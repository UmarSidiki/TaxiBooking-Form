import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import CalendarFeed from "@/features/calendar/model/CalendarFeed";
import { jsonError } from "@/shared/http/json-error";

function feedRole(role: string | undefined) {
  if (role === "driver" || role === "partner") return role;
  if (role === "admin" || role === "superadmin") return "admin" as const;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = feedRole(session?.user?.role);
    if (!session?.user || !role) return jsonError("unauthorized", 401);
    await connectDB();
    let feed = await CalendarFeed.findOne({
      ownerId: session.user.id,
      role,
      revokedAt: { $exists: false },
    }).lean();
    if (!feed) {
      feed = (await CalendarFeed.create({
        ownerId: session.user.id,
        role,
        token: randomBytes(24).toString("hex"),
      })).toObject();
    }
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      success: true,
      url: `${origin}/api/calendar/${feed.token}.ics`,
    });
  } catch (error) {
    console.error("Calendar link failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const role = feedRole(session?.user?.role);
    if (!session?.user || !role) return jsonError("unauthorized", 401);
    await connectDB();
    await CalendarFeed.updateMany(
      { ownerId: session.user.id, role, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar revoke failed:", error);
    return jsonError("internal_error", 500);
  }
}
