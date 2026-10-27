import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminAddress } from "@/lib/admin-auth";

export const ADMIN_SESSION_COOKIE = "web3uoa_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;
export const ADMIN_LOGIN_TTL_MS = 5 * 60 * 1000;

export interface AdminLoginChallengeFields {
  walletAddress: string;
  origin: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}

export function buildAdminLoginMessage(
  challenge: AdminLoginChallengeFields,
): string {
  const domain = new URL(challenge.origin).host;
  return `${domain} requests a WEB3UOA admin sign-in.\n\nThis signs you in to the admin dashboard. It does not send a transaction or cost gas.\n\nAddress: ${challenge.walletAddress}\nURI: ${challenge.origin}\nNonce: ${challenge.nonce}\nIssued At: ${challenge.issuedAt.toISOString()}\nExpiration Time: ${challenge.expiresAt.toISOString()}`;
}

export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getPrisma() {
  return (await import("@/lib/prisma")).prisma;
}

export async function createAdminSession(walletAddress: string) {
  const prisma = await getPrisma();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + ADMIN_SESSION_TTL_SECONDS * 1000,
  );
  const token = randomBytes(32).toString("base64url");

  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lte: now } },
  });

  await prisma.adminSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      walletAddress: walletAddress.toLowerCase(),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getAdminSession(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const prisma = await getPrisma();
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
  });
  if (!session) return null;

  if (
    session.expiresAt.getTime() <= Date.now() ||
    !isAllowedAdminAddress(session.walletAddress)
  ) {
    await prisma.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return { address: session.walletAddress };
}

export async function deleteAdminSession(token?: string) {
  if (!token || token.length > 128) return;
  const prisma = await getPrisma();
  await prisma.adminSession.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export function setAdminSessionCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
