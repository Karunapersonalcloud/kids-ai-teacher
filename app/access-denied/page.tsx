import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ff] p-5">
      <section className="max-w-xl rounded-3xl bg-white p-7 text-center shadow-sm">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Access Denied</h1>
        <p className="mt-3 font-semibold leading-7 text-slate-600">This area needs approved access. Please login with an approved account or register for access.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="rounded-2xl bg-purple-600 px-5 py-3 font-black text-white">Login</Link>
          <Link href="/register" className="rounded-2xl bg-purple-50 px-5 py-3 font-black text-purple-700">Register</Link>
        </div>
      </section>
    </main>
  );
}
