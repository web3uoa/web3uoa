import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteName } from "@/lib/namestone";
import { isSameOriginRequest, requireAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  try {
    const { name, claimId } = await req.json();

    // Delete from NameStone
    await deleteName({
      domain: "web3uoa.eth",
      name,
    });

    if (claimId) {
      await prisma.claimRequest.update({
        where: { id: claimId },
        data: { status: "REJECTED" }, // or we could delete the record
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke" },
      { status: 500 },
    );
  }
}
