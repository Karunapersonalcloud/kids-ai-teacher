"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangeCredentialsPage() {
  const router = useRouter();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/change-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPin, confirmPin }),
    });
    const data = (await response.json()) as { error?: string; redirectTo?: string };
    if (!response.ok) {
      setMessage(data.error || "Could not update credentials.");
      return;
    }
    router.push(data.redirectTo || "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ff] p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <div className="rounded-full bg-amber-100 px-3 py-1 text-center text-xs font-black text-amber-800">First login security step</div>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Change Your PIN</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Please choose a new PIN/password before using the full app.</p>
        <input value={newPin} onChange={(event) => setNewPin(event.target.value)} type="password" className="mt-5 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="New PIN/password" />
        <input value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} type="password" className="mt-3 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="Confirm PIN/password" />
        {message && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}
        <button className="mt-5 w-full rounded-xl bg-purple-600 px-5 py-3 font-black text-white">Save and Continue</button>
      </form>
    </main>
  );
}
