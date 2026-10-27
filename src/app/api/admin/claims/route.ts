import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest, requireAdminSession } from "@/lib/admin-session";

// GET all claims (filter by status)
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const claims = await prisma.claimRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ claims });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 },
    );
  }
}

// Update claim status (Approve / Reject)
export async function PUT(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  try {
    const body = await req.json();
    const { id, status } = body;
    if (
      typeof id !== "string" ||
      (status !== "APPROVED" && status !== "REJECTED")
    ) {
      return NextResponse.json({ error: "Invalid claim update." }, { status: 400 });
    }

    const updated = await prisma.claimRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ claim: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 },
    );
  }
}
