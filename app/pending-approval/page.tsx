import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ff] p-5">
      <section className="max-w-xl rounded-3xl bg-white p-7 text-center shadow-sm">
        <div className="text-5xl">⏳</div>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Registration Pending</h1>
        <p className="mt-3 font-semibold leading-7 text-slate-600">Registration submitted. Access will be enabled after admin approval.</p>
        <Link href="/demo" className="mt-6 inline-flex rounded-2xl bg-purple-600 px-5 py-3 font-black text-white">View Demo Mode</Link>
      </section>
    </main>
  );
}
