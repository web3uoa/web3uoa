import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { Resend } from "resend";
import { getAdminSession, isSameOriginRequest } from "@/lib/admin-session";
import {
  MAX_BODY_LENGTH,
  MAX_SUBJECT_LENGTH,
  RESEND_BATCH_SIZE,
  isValidEmail,
  renderEmail,
} from "@/lib/email";

const DEFAULT_REPLY_TO = "team@web3uoa.nz";

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

  let payload: { recipients?: unknown; subject?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { recipients, subject, body } = payload;
  if (
    !Array.isArray(recipients) ||
    typeof subject !== "string" ||
    typeof body !== "string" ||
    !recipients.every((r) => typeof r === "string")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const list = recipients as string[];
  if (list.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient." },
      { status: 400 },
    );
  }
  if (new Set(list).size !== list.length || !list.every(isValidEmail)) {
    return NextResponse.json(
      { error: "Recipients must be unique, valid email addresses." },
      { status: 400 },
    );
  }
  if (!subject.trim() || subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json(
      { error: `Subject is required (max ${MAX_SUBJECT_LENGTH} characters).` },
      { status: 400 },
    );
  }
  if (!body.trim() || body.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body is required (max ${MAX_BODY_LENGTH} characters).` },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "RESEND_API_KEY and EMAIL_FROM must be configured." },
      { status: 500 },
    );
  }
  const replyTo = process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO;

  const { html, text } = renderEmail(body);
  const resend = new Resend(apiKey);

  // One message per recipient so nobody sees anyone else's address.
  const emails = list.map((to) => ({
    from,
    to: [to],
    replyTo,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>`,
    },
  }));

  try {
    const requestId = randomUUID();
    const idempotencyKey = createHash("sha256")
      .update(session.address)
      .update(requestId)
      .digest("hex");

    // Match the standard /emails endpoint used by our working Resend integration
    // for single-recipient sends. Keep the batch API for private multi-recipient sends.
    if (emails.length === 1) {
      const { data, error } = await resend.emails.send(emails[0], {
        idempotencyKey,
      });

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || "Resend rejected the request." },
          { status: 502 },
        );
      }

      return NextResponse.json({ sent: 1, failed: [] });
    }

    let sent = 0;
    const failed: { email: string; message: string }[] = [];

    for (let start = 0; start < emails.length; start += RESEND_BATCH_SIZE) {
      const chunk = emails.slice(start, start + RESEND_BATCH_SIZE);
      const chunkIndex = Math.floor(start / RESEND_BATCH_SIZE);
      const chunkIdempotencyKey = createHash("sha256")
        .update(session.address)
        .update(requestId)
        .update(`:batch:${chunkIndex}`)
        .digest("hex");

      const { data, error } = await resend.batch.send(chunk, {
        batchValidation: "permissive",
        // A stable, distinct key per chunk makes retries safe without collisions.
        idempotencyKey: chunkIdempotencyKey,
      });

      if (error || !data) {
        const message = error?.message || "Resend rejected the request.";
        for (let index = start; index < list.length; index++) {
          failed.push({
            email: list[index],
            message: index < start + chunk.length
              ? message
              : `Not attempted because an earlier batch failed: ${message}`,
          });
        }
        break;
      }

      sent += data.data.length;
      for (const itemError of data.errors ?? []) {
        const email = list[start + itemError.index];
        if (email) failed.push({ email, message: itemError.message });
      }
    }

    return NextResponse.json({
      sent,
      failed,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    return NextResponse.json(
      { error: "Failed to send emails." },
      { status: 500 },
    );
  }
}
