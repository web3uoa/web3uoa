import { NextRequest, NextResponse } from "next/server";
import { getNames } from "@/lib/namestone";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  try {
    const names = await getNames("web3uoa.eth");
    return NextResponse.json(names);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch names" },
      { status: 500 },
    );
  }
}
