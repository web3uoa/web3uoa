"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseRecipients } from "@/lib/email";

interface Member {
  id: string;
  email: string;
  createdAt: string;
}

interface MembersPanelProps {
  onSelectionChange: (emails: string[]) => void;
}

const fieldClass =
  "w-full rounded-xl border border-input bg-foreground/5 px-4 py-3 outline-none transition-all focus:border-primary";

export function MembersPanel({ onSelectionChange }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Map<string, string>>(
    new Map(),
  );
  const [importText, setImportText] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);

  const parsedImport = useMemo(() => parseRecipients(importText), [importText]);
  const allVisibleSelected =
    members.length > 0 && members.every((member) => selectedMembers.has(member.id));
  const someVisibleSelected = members.some((member) => selectedMembers.has(member.id));

  const loadMembers = useCallback(async (search: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/members?q=${encodeURIComponent(search)}`,
        { credentials: "same-origin", cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMembers(data.members as Member[]);
      setTotal(data.total as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMembers(query), 200);
    return () => window.clearTimeout(timer);
  }, [query, loadMembers]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleMember = (member: Member) => {
    const next = new Map(selectedMembers);
    if (next.has(member.id)) next.delete(member.id);
    else next.set(member.id, member.email);
    setSelectedMembers(next);
    onSelectionChange(Array.from(next.values()));
  };

  const toggleAllVisible = () => {
    const next = new Map(selectedMembers);
    if (allVisibleSelected) {
      for (const member of members) next.delete(member.id);
    } else {
      for (const member of members) next.set(member.id, member.email);
    }
    setSelectedMembers(next);
    onSelectionChange(Array.from(next.values()));
  };

  const importMembers = async () => {
    if (parsedImport.valid.length === 0) return;
    setImporting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedImport.valid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`);
      setNotice(
        `${data.added} added · ${data.alreadySaved} already saved${
          parsedImport.duplicates > 0
            ? ` · ${parsedImport.duplicates} duplicate${parsedImport.duplicates === 1 ? "" : "s"} in the file removed`
            : ""
        }`,
      );
      setImportText("");
      await loadMembers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import members.");
    } finally {
      setImporting(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedMembers.size === 0) return;
    const count = selectedMembers.size;
    if (!window.confirm(`Delete ${count} selected member${count === 1 ? "" : "s"}?`)) {
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedMembers.keys()) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`);
      setSelectedMembers(new Map());
      onSelectionChange([]);
      setNotice(`${data.deleted} member${data.deleted === 1 ? "" : "s"} deleted.`);
      await loadMembers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete members.");
    } finally {
      setDeleting(false);
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setImportText(await file.text());
      setNotice("");
      setError("");
    } catch {
      setError("Could not read that file.");
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-border bg-foreground/[0.03] p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Saved members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import and search members. Selecting them updates the recipient list automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={deleteSelected}
            disabled={selectedMembers.size === 0 || deleting}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            {deleting ? "Deleting…" : `Delete selected (${selectedMembers.size})`}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setNotice("");
            }}
            placeholder="Paste a CSV/email list or enter one email address per line"
            rows={3}
            className={`${fieldClass} font-mono text-sm`}
            aria-label="Member emails to import"
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                void loadFile(file);
              }}
              className="text-xs file:mr-2 file:rounded-lg file:border file:border-input file:bg-transparent file:px-2 file:py-1 file:text-foreground"
              aria-label="Choose member CSV file"
            />
            <span>
              {parsedImport.valid.length} valid · {parsedImport.duplicates} duplicates ·{" "}
              {parsedImport.invalid.length} invalid
            </span>
          </div>
          {parsedImport.invalid.length > 0 && (
            <p className="mt-2 break-all text-xs text-yellow-400">
              Invalid: {parsedImport.invalid.slice(0, 5).join(", ")}
              {parsedImport.invalid.length > 5 &&
                ` and ${parsedImport.invalid.length - 5} more`}
            </p>
          )}
        </div>
        <Button
          onClick={importMembers}
          disabled={parsedImport.valid.length === 0 || importing}
          className="self-start"
        >
          {importing ? "Saving…" : "Save members"}
        </Button>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search saved members by email"
          className={`${fieldClass} sm:max-w-md`}
          aria-label="Search saved members"
        />
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${total} member${total === 1 ? "" : "s"}`}
          {selectedMembers.size > 0 && ` · ${selectedMembers.size} selected`}
        </p>
      </div>

      {(error || notice) && (
        <p
          className={`mb-3 rounded-lg p-3 text-sm ${
            error ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
          }`}
          role="status"
        >
          {error || notice}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-foreground/[0.04] text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-3">
                <label className="flex items-center gap-2 normal-case">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label={`Select all ${total} matching members`}
                    disabled={members.length === 0 || loading}
                  />
                  All
                </label>
              </th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMember(member)}
                    aria-label={`Select ${member.email}`}
                  />
                </td>
                <td className="break-all px-4 py-3 font-mono text-xs sm:text-sm">
                  {member.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && members.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {query ? "No members match that search." : "No saved members yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
