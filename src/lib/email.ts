// Shared by the admin email panel (browser) and the send route (server).

export const RESEND_BATCH_SIZE = 100; // Resend allows at most 100 emails per batch request.
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_BODY_LENGTH = 20_000;

const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const SPLIT_PATTERN = /[\s,;]+/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export interface ParsedRecipients {
  valid: string[];
  invalid: string[];
  duplicates: number;
}

/** Splits pasted text or CSV into unique, lowercased, valid addresses. */
export function parseRecipients(raw: string): ParsedRecipients {
  const tokens = raw
    .split(SPLIT_PATTERN)
    .map((t) =>
      t
        .trim()
        .replace(/^["'<]+|["'>]+$/g, "")
        .toLowerCase(),
    )
    .filter(Boolean);

  // A CSV exported from a sheet usually starts with an "email" header.
  if (tokens[0] === "email" || tokens[0] === "emails") tokens.shift();

  const seen = new Set<string>();
  const invalid: string[] = [];
  let duplicates = 0;

  for (const token of tokens) {
    if (!isValidEmail(token)) {
      invalid.push(token);
    } else if (seen.has(token)) {
      duplicates++;
    } else {
      seen.add(token);
    }
  }

  return { valid: Array.from(seen), invalid, duplicates };
}

const FOOTER_TEXT =
  "You're receiving this because you signed up to the University of Auckland Web3 Club (WEB3UOA). Reply to this email to unsubscribe.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text body in, escaped HTML plus a text alternative out. */
export function renderEmail(body: string): { html: string; text: string } {
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.55;color:#111;max-width:600px">
<div>${escapeHtml(body).replace(/\r?\n/g, "<br>")}</div>
<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 14px">
<p style="font-size:12px;color:#666;margin:0">${escapeHtml(FOOTER_TEXT)}</p>
</div>`;

  return { html, text: `${body}\n\n--\n${FOOTER_TEXT}` };
}
