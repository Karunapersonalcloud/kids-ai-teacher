"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [showLocalAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    return process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1" || host === "::1");
  });

  async function login(adminDemo = false) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, pin, adminDemo }),
    });
    const data = (await response.json()) as { user?: { status: string; role: string; mustChangeCredentials?: boolean }; error?: string };
    if (!response.ok || !data.user) {
      setMessage(data.error || "Login failed.");
      return;
    }
    if (data.user.status === "pending") router.push("/pending-approval");
    else if (data.user.status === "rejected" || data.user.status === "blocked" || data.user.status === "expired") router.push("/access-denied");
    else if (data.user.mustChangeCredentials) router.push("/change-credentials");
    else if (data.user.role === "admin") router.push("/admin");
    else if (data.user.status === "trial" || data.user.status === "active") router.push("/dashboard");
    else router.push("/access-denied");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ff] p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-black text-purple-700">← Back</Link>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Parent Login</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Admin and approved parents can login using their registered email/mobile and PIN.</p>
        <p className="mt-3 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold leading-6 text-purple-800">
          Forgot your PIN or waiting for approval? Contact support@conceptkid.in.
        </p>
        {showLocalAdmin && (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-black text-amber-800">Family Admin Login</div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Local Dev Only</span>
            </div>
            <button onClick={() => login(true)} className="mt-3 w-full rounded-xl bg-amber-100 px-5 py-3 font-black text-amber-800">Use Local Family Admin</button>
          </div>
        )}
        <div className="mt-5 rounded-2xl bg-purple-50 p-4">
          <div className="font-black text-purple-800">Email / Mobile Login</div>
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-3 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="Email or mobile" />
          <input value={pin} onChange={(event) => setPin(event.target.value)} type="password" className="mt-3 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="PIN/password" />
        </div>
        {message && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}
        <button onClick={() => login(false)} className="mt-5 w-full rounded-xl bg-purple-600 px-5 py-3 font-black text-white">Login</button>
      </section>
    </main>
  );
}
