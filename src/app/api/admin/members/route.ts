import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest, requireAdminSession } from "@/lib/admin-session";
import { isValidEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length > 254) {
    return NextResponse.json({ error: "Search text is too long." }, { status: 400 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const where = query
      ? { email: { contains: query, mode: "insensitive" as const } }
      : {};
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { email: "asc" },
        select: { id: true, email: true, createdAt: true },
      }),
      prisma.member.count({ where }),
    ]);

    return NextResponse.json(
      { members, total },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Member list failed:", err);
    return NextResponse.json(
      { error: "Could not load members." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  let payload: { emails?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !Array.isArray(payload.emails) ||
    !payload.emails.every((email) => typeof email === "string")
  ) {
    return NextResponse.json({ error: "Emails must be a list of addresses." }, { status: 400 });
  }

  const emails = (payload.emails as string[])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const invalid = emails.filter((email) => !isValidEmail(email));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: "The import contains invalid email addresses.", invalid },
      { status: 400 },
    );
  }

  const uniqueEmails = [...new Set(emails)];
  if (uniqueEmails.length === 0) {
    return NextResponse.json({ error: "Add at least one valid email." }, { status: 400 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.member.createMany({
      data: uniqueEmails.map((email) => ({ email })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      added: result.count,
      alreadySaved: uniqueEmails.length - result.count,
      duplicatesInImport: emails.length - uniqueEmails.length,
    });
  } catch (err) {
    console.error("Member import failed:", err);
    return NextResponse.json(
      { error: "Could not save members." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = await requireAdminSession(req);
  if (auth !== true) return auth;

  let payload: { ids?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !Array.isArray(payload.ids) ||
    !payload.ids.every(
      (id) =>
        typeof id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
    )
  ) {
    return NextResponse.json({ error: "Member IDs are invalid." }, { status: 400 });
  }

  const ids = [...new Set(payload.ids as string[])];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Select at least one member." }, { status: 400 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.member.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    console.error("Member deletion failed:", err);
    return NextResponse.json(
      { error: "Could not delete members." },
      { status: 500 },
    );
  }
}
