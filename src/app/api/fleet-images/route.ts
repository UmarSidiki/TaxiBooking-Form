import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Prefer a dedicated `public/fleet` folder if it exists, otherwise read the public root
    const fleetDir = path.join(process.cwd(), "public", "fleet");
    let dirToRead = "";

    if (fs.existsSync(fleetDir) && fs.statSync(fleetDir).isDirectory()) {
      dirToRead = fleetDir;
    } else {
      dirToRead = path.join(process.cwd(), "public");
    }

    const files = fs.readdirSync(dirToRead);

    const images = files
      .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
      .map((f) => {
        // If we read from public/fleet, include the folder in the public path
        if (dirToRead.endsWith("/fleet") || dirToRead.endsWith("\\fleet")) {
          return `/fleet/${f}`;
        }
        return `/${f}`;
      });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("Error reading public folder for fleet images", error);
    return NextResponse.json({ success: false, data: [], message: "Failed to read public images" }, { status: 500 });
  }
}
