"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MembersPanel } from "@/components/admin/members-panel";
import {
  MAX_BODY_LENGTH,
  MAX_SUBJECT_LENGTH,
  isValidEmail,
  parseRecipients,
} from "@/lib/email";

interface SendResult {
  sent: number;
  failed: { email: string; message: string }[];
}

interface UsageWindow {
  used: number;
  limit: number | null;
  sent: number;
  received: number;
  resetsAt: string;
}

interface ResendUsage {
  daily: UsageWindow;
  monthly: UsageWindow;
}

function formatUsage(window: UsageWindow): string {
  if (window.limit === null) {
    return `${window.used.toLocaleString()} used · no cap`;
  }

  const remaining = Math.max(0, window.limit - window.used);
  return `${window.used.toLocaleString()} / ${window.limit.toLocaleString()} used · ${remaining.toLocaleString()} remaining`;
}

function formatReset(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "reset time unavailable";
  return `Resets ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)}`;
}

function removeSelectedEmails(raw: string, selectedEmails: string[]): string {
  const selected = new Set(selectedEmails.map((email) => email.toLowerCase()));
  return raw
    .split(/([\s,;]+)/)
    .filter((part, index) => {
      if (index % 2 === 1) return true;
      const email = part
        .trim()
        .replace(/^["'<]+|["'>]+$/g, "")
        .toLowerCase();
      return !selected.has(email);
    })
    .join("")
    .replace(/^[\s,;]+|[\s,;]+$/g, "");
}

const fieldClass =
  "w-full rounded-xl border border-input bg-foreground/5 px-4 py-3 outline-none transition-all focus:border-primary";

export function EmailPanel() {
  const [manualRecipientText, setManualRecipientText] = useState("");
  const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testAddress, setTestAddress] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);
  const [resultLabel, setResultLabel] = useState("");
  const [resendUsage, setResendUsage] = useState<ResendUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  const manualParsed = useMemo(
    () => parseRecipients(manualRecipientText),
    [manualRecipientText],
  );
  const parsed = useMemo(() => {
    const valid = [...manualParsed.valid];
    const seen = new Set(valid);
    let overlaps = 0;

    for (const email of selectedMemberEmails) {
      const normalized = email.toLowerCase();
      if (seen.has(normalized)) {
        overlaps++;
      } else {
        seen.add(normalized);
        valid.push(normalized);
      }
    }

    return {
      valid,
      invalid: manualParsed.invalid,
      duplicates: manualParsed.duplicates + overlaps,
    };
  }, [manualParsed, selectedMemberEmails]);
  const recipientText = useMemo(() => {
    const manualEmails = new Set(manualParsed.valid);
    const selectedOnly = selectedMemberEmails.filter(
      (email) => !manualEmails.has(email.toLowerCase()),
    );
    return [manualRecipientText.trim(), selectedOnly.join("\n")]
      .filter(Boolean)
      .join("\n");
  }, [manualParsed.valid, manualRecipientText, selectedMemberEmails]);
  const contentReady = subject.trim().length > 0 && body.trim().length > 0;
  const canSend =
    contentReady && parsed.valid.length > 0 && !sending && !usageLoading;
  const testTo = testAddress.trim().toLowerCase();
  const canTest =
    contentReady && isValidEmail(testTo) && !sending && !usageLoading;

  const loadResendUsage = async () => {
    setUsageLoading(true);
    setUsageError("");
    try {
      const res = await fetch("/api/admin/email/usage", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResendUsage(data as ResendUsage);
    } catch (err) {
      setUsageError(err instanceof Error ? err.message : "Could not load usage");
    } finally {
      setUsageLoading(false);
    }
  };

  // The server authorizes sends through the current admin session.
  const send = async (recipients: string[], finalSubject: string) => {
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject: finalSubject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  const sendTest = () => {
    setResultLabel("Test email");
    send([testTo], `[TEST] ${subject}`);
  };

  const sendAll = () => {
    setResultLabel("Campaign");
    send(parsed.valid, subject);
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setManualRecipientText(await file.text());
  };

  return (
    <section>
      <h2 className="mb-2 text-2xl font-bold">Send Email</h2>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        Paste or upload the recipient list, write the message and send. Each
        person gets their own copy, so addresses are never shared.
      </p>

      <div className="mb-8 rounded-2xl border border-border bg-foreground/[0.03] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Resend email usage</h3>
          </div>
          <Button
            variant="outline"
            onClick={loadResendUsage}
            disabled={usageLoading || sending || confirming}
          >
            {usageLoading
              ? "Checking…"
              : resendUsage
                ? "Refresh usage"
                : "Check limits"}
          </Button>
        </div>

        {usageError && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {usageError}
          </p>
        )}

        {resendUsage && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([
              ["Daily", resendUsage.daily],
              ["Monthly", resendUsage.monthly],
            ] as const).map(([label, window]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-background/40 p-4"
              >
                <p className="text-xs font-mono uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{formatUsage(window)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {window.sent.toLocaleString()} sent ·{" "}
                  {window.received.toLocaleString()} received ·{" "}
                  {formatReset(window.resetsAt)}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      <MembersPanel onSelectionChange={setSelectedMemberEmails} />

      <div className="grid gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="font-mono text-xs uppercase text-muted-foreground">
            Recipients
          </label>
          <textarea
            value={recipientText}
            onChange={(e) =>
              setManualRecipientText(
                removeSelectedEmails(e.target.value, selectedMemberEmails),
              )
            }
            placeholder="alex@example.com, sam@example.com&#10;or one per line"
            rows={8}
            className={`${fieldClass} font-mono text-sm`}
          />
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => loadFile(e.target.files?.[0])}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-foreground"
          />
          <div className="text-sm">
            <span className="text-primary">
              {parsed.valid.length} valid
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {parsed.duplicates} duplicate
              {parsed.duplicates === 1 ? "" : "s"} removed ·{" "}
            </span>
            <span
              className={
                parsed.invalid.length
                  ? "text-yellow-400"
                  : "text-muted-foreground"
              }
            >
              {parsed.invalid.length} invalid
            </span>
          </div>
          {parsed.invalid.length > 0 && (
            <p className="break-all text-xs text-yellow-400">
              Invalid: {parsed.invalid.slice(0, 10).join(", ")}
              {parsed.invalid.length > 10 &&
                ` and ${parsed.invalid.length - 10} more`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-mono text-xs uppercase text-muted-foreground">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={MAX_SUBJECT_LENGTH}
            placeholder="Subject line"
            className={fieldClass}
          />
          <label className="font-mono text-xs uppercase text-muted-foreground">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_BODY_LENGTH}
            rows={9}
            placeholder="Plain text. Line breaks are kept."
            className={fieldClass}
          />
          <p className="text-xs text-muted-foreground">
            A footer with the club name and an unsubscribe line is added
            automatically.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-border bg-foreground/[0.03] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            placeholder="Send a test to your own address"
            className={`${fieldClass} sm:max-w-sm`}
          />
          <Button variant="outline" onClick={sendTest} disabled={!canTest}>
            Send test
          </Button>
        </div>

        {!confirming ? (
          <Button
            onClick={() => setConfirming(true)}
            disabled={!canSend}
            className="w-fit"
          >
            Review and send to {parsed.valid.length || "…"} recipients
          </Button>
        ) : (
          <div className="rounded-xl border border-primary/40 p-4">
            <p className="mb-1 font-semibold">
              Send &ldquo;{subject}&rdquo; to {parsed.valid.length} recipient
              {parsed.valid.length === 1 ? "" : "s"}?
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              This can&apos;t be undone. Review the recipient list before sending.
            </p>
            <div className="flex gap-3">
              <Button onClick={sendAll} disabled={sending || usageLoading}>
                {sending ? "Sending…" : "Confirm and send"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={sending || usageLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-lg bg-primary/10 p-3 text-sm">
            <p className="font-semibold text-primary">
              {resultLabel} sent to {result.sent} recipient
              {result.sent === 1 ? "" : "s"}.
            </p>
            {result.failed.length > 0 && (
              <div className="mt-2 text-red-400">
                <p>{result.failed.length} failed:</p>
                <ul className="list-disc pl-5">
                  {result.failed.map((f) => (
                    <li key={f.email} className="break-all">
                      {f.email}: {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
