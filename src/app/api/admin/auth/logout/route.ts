import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  deleteAdminSession,
  isSameOriginRequest,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    const response = NextResponse.json({ authenticated: false });
    clearAdminSessionCookie(response);
    return response;
  } catch (err) {
    console.error("Admin sign-out failed:", err);
    return NextResponse.json(
      { error: "Could not sign out." },
      { status: 500 },
    );
  }
}
