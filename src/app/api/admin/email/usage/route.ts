import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession, isSameOriginRequest } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let session: { address: string } | null;
  try {
    session = await getAdminSession(req);
  } catch (err) {
    console.error("Admin session check failed:", err);
    return NextResponse.json(
      { error: "Could not verify admin session." },
      { status: 500 },
    );
  }
  if (!session) {
    return NextResponse.json({ error: "Admin session expired. Sign in again." }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY must be configured." },
      { status: 500 },
    );
  }

  try {
    const { data, error } = await new Resend(apiKey).usage.get();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Could not load Resend usage." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      daily: {
        used: data.emails.daily.used,
        limit: data.emails.daily.limit,
        sent: data.emails.daily.sent,
        received: data.emails.daily.received,
        resetsAt: data.emails.daily.resets_at,
      },
      monthly: {
        used: data.emails.monthly.used,
        limit: data.emails.monthly.limit,
        sent: data.emails.monthly.sent,
        received: data.emails.monthly.received,
        resetsAt: data.emails.monthly.resets_at,
      },
    });
  } catch (err) {
    console.error("Resend usage lookup failed:", err);
    return NextResponse.json(
      { error: "Could not load Resend usage." },
      { status: 500 },
    );
  }
}
