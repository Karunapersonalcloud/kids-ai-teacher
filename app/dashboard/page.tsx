import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("kids_user_type")?.value === "externalUser") {
    return <ExternalUserDashboard />;
  }
  return <DashboardHome />;
}

function ExternalUserDashboard() {
  return (
    <main className="min-h-screen bg-[#f7f5ff] p-5">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm">
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Approved User Workspace</span>
        <h1 className="mt-4 text-3xl font-black text-purple-800">Welcome to Kids AI Teacher</h1>
        <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
          Your child workspace is active. Family-only profiles, local textbook paths, and internal materials are hidden from external accounts.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/ai-teacher" className="rounded-2xl bg-purple-600 p-5 font-black text-white">Ask AI Teacher</Link>
          <Link href="/visual-learning" className="rounded-2xl bg-blue-50 p-5 font-black text-blue-700">Create Visual Lesson</Link>
          <Link href="/quizzes" className="rounded-2xl bg-green-50 p-5 font-black text-green-700">Practice Quiz</Link>
        </div>
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          Downloads are restricted. You can learn from approved material inside the app.
        </div>
      </section>
    </main>
  );
}
