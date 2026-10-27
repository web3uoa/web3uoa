"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Claim {
  id: string;
  requestedName: string;
  walletAddress: string;
  status: string;
}

interface ActiveName {
  name: string;
  address: string;
}

export function EnsPanel() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activeNames, setActiveNames] = useState<ActiveName[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [claimsRes, namesRes] = await Promise.all([
        fetch("/api/admin/claims", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/admin/names", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);
      const [claimsData, namesData] = await Promise.all([
        claimsRes.json().catch(() => ({})),
        namesRes.json().catch(() => ({})),
      ]);
      if (!claimsRes.ok) {
        throw new Error(claimsData.error || `Could not load claims (${claimsRes.status})`);
      }
      if (!namesRes.ok) {
        throw new Error(namesData.error || `Could not load names (${namesRes.status})`);
      }

      setClaims(Array.isArray(claimsData.claims) ? claimsData.claims : []);
      setActiveNames(Array.isArray(namesData) ? namesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ENS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runAction = async (
    key: string,
    url: string,
    method: "POST" | "PUT",
    payload: Record<string, string>,
    successMessage: string,
  ) => {
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      await loadData();
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action failed.");
    } finally {
      setBusyKey("");
    }
  };

  const pendingClaims = claims.filter((claim) => claim.status === "PENDING");

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">ENS management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review member requests and manage active subnames.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading || !!busyKey}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {(error || notice) && (
        <p
          className={`mb-5 rounded-lg p-3 text-sm ${
            error ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
          }`}
          role="status"
        >
          {error || notice}
        </p>
      )}

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="mb-4 border-b border-border pb-3 text-xl font-bold">
            Pending Requests
          </h3>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : pendingClaims.length === 0 ? (
            <p className="italic text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all text-lg font-bold">
                      {claim.requestedName}.web3uoa.eth
                    </p>
                    <p className="break-all text-xs text-muted-foreground">
                      {claim.walletAddress}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!!busyKey}
                      onClick={() =>
                        void runAction(
                          claim.id,
                          "/api/admin/approve",
                          "POST",
                          { claimId: claim.id },
                          `Approved ${claim.requestedName}.web3uoa.eth.`,
                        )
                      }
                    >
                      {busyKey === claim.id ? "Working…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!!busyKey}
                      onClick={() =>
                        void runAction(
                          `reject-${claim.id}`,
                          "/api/admin/claims",
                          "PUT",
                          { id: claim.id, status: "REJECTED" },
                          `Rejected ${claim.requestedName}.web3uoa.eth.`,
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 border-b border-border pb-3 text-xl font-bold">
            Active Subnames
          </h3>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : activeNames.length === 0 ? (
            <p className="italic text-muted-foreground">No active subnames.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeNames.map((entry) => (
                <div
                  key={entry.name}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all text-lg font-bold">
                      {entry.name}.web3uoa.eth
                    </p>
                    <p className="break-all text-xs text-muted-foreground">
                      {entry.address}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!!busyKey}
                    onClick={() => {
                      if (!window.confirm(`Revoke ${entry.name}.web3uoa.eth?`)) return;
                      void runAction(
                        entry.name,
                        "/api/admin/revoke",
                        "POST",
                        { name: entry.name },
                        `Revoked ${entry.name}.web3uoa.eth.`,
                      );
                    }}
                  >
                    {busyKey === entry.name ? "Working…" : "Revoke"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
