"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import { EmailPanel } from "@/components/admin/email-panel";
import { isAllowedAdminAddress } from "@/lib/admin-auth";

type SessionState = "checking" | "signed-out" | "signed-in" | "error";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [mounted, setMounted] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkSession = useCallback(async () => {
    setSessionState("checking");
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        setSessionAddress(null);
        setSessionState("signed-out");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.address !== "string") {
        throw new Error(data.error || "Could not check admin session.");
      }
      setSessionAddress(data.address.toLowerCase());
      setSessionState("signed-in");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not check admin session.");
      setSessionState("error");
    }
  }, []);

  useEffect(() => {
    if (mounted) void checkSession();
  }, [mounted, checkSession]);

  const signIn = async () => {
    if (!address || !isAllowedAdminAddress(address)) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const challengeRes = await fetch("/api/admin/auth/challenge", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const challenge = await challengeRes.json().catch(() => ({}));
      if (!challengeRes.ok) {
        throw new Error(challenge.error || `Sign-in failed (${challengeRes.status})`);
      }

      const signature = await signMessageAsync({ message: challenge.message });
      const loginRes = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, nonce: challenge.nonce, signature }),
      });
      const login = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        throw new Error(login.error || `Sign-in failed (${loginRes.status})`);
      }

      setSessionAddress(String(login.address).toLowerCase());
      setSessionState("signed-in");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Sign-out failed (${res.status})`);
      setSessionAddress(null);
      setSessionState("signed-out");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  if (!mounted || sessionState === "checking") {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center container mx-auto px-4">
        <p className="text-foreground/70">Checking admin session…</p>
      </div>
    );
  }

  if (sessionState === "error") {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center container mx-auto px-4">
        <div className="max-w-lg text-center">
          <h1 className="mb-4 text-3xl font-bold">Could not check admin session</h1>
          <p className="mb-6 text-foreground/70">{authError}</p>
          <Button onClick={checkSession}>Try again</Button>
        </div>
      </div>
    );
  }

  if (sessionState === "signed-in" && sessionAddress) {
    return (
      <div className="min-h-screen py-24 container mx-auto px-4">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black">Admin Dashboard</h1>
            <p className="mt-2 break-all font-mono text-xs text-foreground/60">
              Signed in as {sessionAddress}
            </p>
          </div>
          <Button variant="outline" onClick={signOut} disabled={authBusy}>
            {authBusy ? "Signing out…" : "Sign out"}
          </Button>
        </div>
        {authError && (
          <p className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {authError}
          </p>
        )}
        <EmailPanel />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center container mx-auto px-4">
        <div className="text-center">
          <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
          <p className="mb-6 text-foreground/70">Connect an admin wallet to sign in.</p>
          <div className="flex justify-center">
            <appkit-button balance="hide" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowedAdminAddress(address)) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center container mx-auto px-4">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Not an admin wallet</h1>
          <p className="mb-2 text-foreground/70">
            This wallet isn&apos;t on the admin allowlist.
          </p>
          <p className="mb-6 break-all font-mono text-xs text-foreground/50">
            {address}
          </p>
          <div className="flex justify-center">
            <appkit-button balance="hide" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 flex items-center justify-center container mx-auto px-4">
      <div className="max-w-lg text-center">
        <h1 className="mb-4 text-3xl font-bold">Sign in to the Admin Panel</h1>
        {authError && (
          <p className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {authError}
          </p>
        )}
        <Button onClick={signIn} disabled={authBusy}>
          {authBusy ? "Signing in…" : "Sign in with wallet"}
        </Button>
      </div>
    </div>
  );
}
