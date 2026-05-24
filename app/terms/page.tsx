import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ff] p-5">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm">
        <Link href="/" className="text-sm font-black text-purple-700">← Back</Link>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Terms</h1>
        <div className="mt-5 space-y-3 font-semibold leading-7 text-slate-600">
          <p>This is an MVP learning platform. Access is currently granted by admin approval.</p>
          <p>Payments and subscriptions are coming soon. Until then, plans and limits are managed by the admin.</p>
          <p>Use the app for school learning support, not for emergency, medical, legal, or high-risk advice.</p>
        </div>
      </section>
    </main>
  );
}
