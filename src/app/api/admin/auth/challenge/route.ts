import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminAddress } from "@/lib/admin-auth";
import {
  ADMIN_LOGIN_TTL_MS,
  buildAdminLoginMessage,
  isSameOriginRequest,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: { address?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof payload.address !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(payload.address) ||
    !isAllowedAdminAddress(payload.address)
  ) {
    return NextResponse.json({ error: "Not an admin wallet" }, { status: 403 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ADMIN_LOGIN_TTL_MS);
  const challenge = {
    walletAddress: payload.address.toLowerCase(),
    origin: req.nextUrl.origin,
    nonce: randomBytes(32).toString("hex"),
    issuedAt: now,
    expiresAt,
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.adminLoginChallenge.deleteMany({
      where: {
        OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }],
      },
    });

    const activeChallenges = await prisma.adminLoginChallenge.count({
      where: {
        walletAddress: challenge.walletAddress,
        consumedAt: null,
        expiresAt: { gt: now },
      },
    });
    if (activeChallenges >= 5) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Wait a few minutes and retry." },
        { status: 429 },
      );
    }

    await prisma.adminLoginChallenge.create({ data: challenge });
    return NextResponse.json(
      {
        nonce: challenge.nonce,
        message: buildAdminLoginMessage(challenge),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Admin sign-in challenge failed:", err);
    return NextResponse.json(
      { error: "Could not start admin sign-in." },
      { status: 500 },
    );
  }
}
