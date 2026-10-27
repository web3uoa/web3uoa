import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, type Address, type Hex } from "viem";
import { isAllowedAdminAddress } from "@/lib/admin-auth";
import {
  buildAdminLoginMessage,
  createAdminSession,
  deleteAdminSession,
  isSameOriginRequest,
  setAdminSessionCookie,
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: { address?: unknown; nonce?: unknown; signature?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof payload.address !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(payload.address) ||
    typeof payload.nonce !== "string" ||
    !/^[0-9a-f]{64}$/.test(payload.nonce) ||
    typeof payload.signature !== "string" ||
    !/^0x[0-9a-fA-F]+$/.test(payload.signature) ||
    !isAllowedAdminAddress(payload.address)
  ) {
    return NextResponse.json({ error: "Invalid sign-in request" }, { status: 400 });
  }

  const walletAddress = payload.address.toLowerCase();
  const now = new Date();

  try {
    const { prisma } = await import("@/lib/prisma");
    const challenge = await prisma.adminLoginChallenge.findUnique({
      where: { nonce: payload.nonce },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() <= now.getTime() ||
      challenge.walletAddress !== walletAddress ||
      challenge.origin !== req.nextUrl.origin
    ) {
      return NextResponse.json({ error: "Sign-in challenge expired" }, { status: 401 });
    }

    let valid = false;
    try {
      valid = await verifyMessage({
        address: walletAddress as Address,
        message: buildAdminLoginMessage(challenge),
        signature: payload.signature as Hex,
      });
    } catch {
      valid = false;
    }
    if (!valid) {
      return NextResponse.json({ error: "Wallet signature is invalid" }, { status: 401 });
    }

    const consumed = await prisma.adminLoginChallenge.updateMany({
      where: {
        nonce: payload.nonce,
        walletAddress,
        origin: req.nextUrl.origin,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) {
      return NextResponse.json({ error: "Sign-in challenge already used" }, { status: 401 });
    }

    await deleteAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    const session = await createAdminSession(walletAddress);
    const response = NextResponse.json(
      { authenticated: true, address: walletAddress },
      { headers: { "Cache-Control": "no-store" } },
    );
    setAdminSessionCookie(response, session.token);
    return response;
  } catch (err) {
    console.error("Admin sign-in failed:", err);
    return NextResponse.json(
      { error: "Could not complete admin sign-in." },
      { status: 500 },
    );
  }
}
