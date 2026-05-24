import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { children, mockUploads } from "@/lib/mock-data";
import { demoParentSession } from "@/lib/auth-types";

export default function ParentPage() {
  return (
    <AppShell activeChildAvatar={children[0].avatar}>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black text-purple-700">Parent Panel</h1>
          <p className="mt-1 font-semibold text-slate-500">Monitor learning, uploads, study readiness, and daily focus.</p>
          <div className="mt-4 rounded-xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700">
            Auth scaffold: viewing as {demoParentSession.displayName} ({demoParentSession.role}). Production auth can protect this route next.
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <article key={child.id} className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{child.avatar}</div>
                  <div><h2 className="text-xl font-black">{child.name}</h2><p className="font-semibold text-slate-500">{child.grade}</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold">
                  <div className="rounded-xl bg-white p-3">Uploads: {mockUploads.filter((item) => item.childId === child.id).length}</div>
                  <div className="rounded-xl bg-white p-3">Quiz: 0 today</div>
                  <div className="rounded-xl bg-white p-3">Reading: pending</div>
                  <div className="rounded-xl bg-white p-3">Plan: ready</div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="space-y-5">
          <Link href="/parent/ai-review" className="block rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-5 text-white shadow-sm">
            <h2 className="text-2xl font-black">AI Learning Health Check</h2>
            <p className="mt-2 font-semibold text-white/85">Review missing uploads, weak areas, and parent actions.</p>
          </Link>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-black text-purple-700">Pending Actions</h2>
            <div className="space-y-2 text-sm font-bold text-slate-600">
              <div className="rounded-xl bg-amber-50 p-3">Upload latest academic diary</div>
              <div className="rounded-xl bg-blue-50 p-3">Complete 20-minute reading practice</div>
              <div className="rounded-xl bg-green-50 p-3">Conduct one short quiz</div>
              <div className="rounded-xl bg-purple-50 p-3">Revise current worksheet</div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
