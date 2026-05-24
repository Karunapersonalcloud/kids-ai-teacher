import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ff] p-5">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm">
        <Link href="/" className="text-sm font-black text-purple-700">← Back</Link>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Privacy Notice</h1>
        <div className="mt-5 space-y-3 font-semibold leading-7 text-slate-600">
          <p>Uploaded files are used only for learning features such as explanations, quizzes, and progress review.</p>
          <p>Parents control access for children. Public users need admin approval before full access.</p>
          <p>The AI teacher is designed for child-safe learning and should not replace a parent, teacher, doctor, or counselor.</p>
          <p>Please do not upload sensitive documents, identity documents, bank records, or private medical records.</p>
        </div>
      </section>
    </main>
  );
}
