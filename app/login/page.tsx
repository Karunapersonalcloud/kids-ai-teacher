"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"parent" | "student">("parent");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [showLocalAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    return process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1" || host === "::1");
  });

  async function login(adminDemo = false) {
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, pin, adminDemo, loginType }),
    });
    const data = (await response.json()) as {
      user?: { status: string; role: string; mustChangeCredentials?: boolean };
      student?: { mustChangeStudentPassword?: boolean };
      loginType?: "parent" | "student";
      error?: string;
    };
    if (!response.ok) {
      setMessage(data.error || "Login failed.");
      return;
    }
    if (data.loginType === "student") {
      if (!data.student) {
        setMessage("Student login failed.");
        return;
      }
      if (data.student.mustChangeStudentPassword) {
        router.push("/student/change-password");
      } else {
        router.push("/student/dashboard");
      }
      return;
    }

    if (!data.user) {
      setMessage("Login failed.");
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="Back to ConceptKid home">
            <BrandLogo />
          </Link>
          <div className="hidden items-center gap-3 text-sm font-semibold text-slate-600 sm:flex">
            <Link href="/" className="transition hover:text-purple-800">Home</Link>
            <Link href="/demo" className="transition hover:text-purple-800">Demo</Link>
            <Link href="/register" className="transition hover:text-purple-800">Register</Link>
            <Link href="/login" className="transition hover:text-purple-800">Student Login</Link>
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Login</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Parents and students can login with their assigned credentials.</p>
        <p className="mt-3 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold leading-6 text-purple-800">
          {loginType === "parent"
            ? "Parent login uses your registered email or mobile with a secure PIN/password. If you can't access your account, use the registered contact or support@conceptkid.in."
            : "Student login uses Student ID with a PIN/password. If you forget your PIN, ask your parent to reset it from the Parent Dashboard."}
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
        <div className="mt-5 flex gap-2 rounded-2xl bg-purple-50 p-2">
          <button
            onClick={() => setLoginType("parent")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${loginType === "parent" ? "bg-purple-600 text-white" : "bg-white text-purple-700"}`}
          >
            Parent Login
          </button>
          <button
            onClick={() => setLoginType("student")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${loginType === "student" ? "bg-purple-600 text-white" : "bg-white text-purple-700"}`}
          >
            Student Login
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-purple-50 p-4">
          <div className="font-black text-purple-800">{loginType === "parent" ? "Email / Mobile Login" : "Student ID Login"}</div>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-3 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold"
            placeholder={loginType === "parent" ? "Email or mobile" : "Student ID"}
          />
          <input value={pin} onChange={(event) => setPin(event.target.value)} type="password" className="mt-3 w-full rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="PIN/password" />
        </div>
        {message && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}
        <button onClick={() => login(false)} className="mt-5 w-full rounded-xl bg-purple-600 px-5 py-3 font-black text-white">Login</button>
      </section>
    </main>
  );
}
