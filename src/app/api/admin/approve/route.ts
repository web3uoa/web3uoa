import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setName } from "@/lib/namestone";
import { isSameOriginRequest, requireAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  try {
    const { claimId } = await req.json();

    const claim = await prisma.claimRequest.findUnique({
      where: { id: claimId },
    });
    if (!claim || claim.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid claim" }, { status: 400 });
    }

    // Call NameStone
    await setName({
      domain: "web3uoa.eth",
      name: claim.requestedName,
      address: claim.walletAddress,
    });

    const updated = await prisma.claimRequest.update({
      where: { id: claimId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({ claim: updated });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to approve" },
      { status: 500 },
    );
  }
}
