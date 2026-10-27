import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  getAdminSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      const response = NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
      if (req.cookies.get(ADMIN_SESSION_COOKIE)) {
        clearAdminSessionCookie(response);
      }
      return response;
    }

    return NextResponse.json(
      { authenticated: true, address: session.address },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Admin session lookup failed:", err);
    return NextResponse.json(
      { error: "Could not check admin session." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
