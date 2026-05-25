"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  BookDown,
  Bot,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Flame,
  Home,
  LineChart,
  Mail,
  Menu,
  ShieldCheck,
  Star,
  UploadCloud,
  Users,
} from "lucide-react";
import { children } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/ai-teacher", label: "AI Teacher", icon: Bot },
  { href: "/visual-learning", label: "Visual Learning", icon: Star },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/homework", label: "Homework", icon: CheckSquare },
  { href: "/exams", label: "Exam Planner", icon: CalendarDays },
  { href: "/uploads", label: "Materials", icon: UploadCloud },
  { href: "/ncert", label: "NCERT Books", icon: BookDown },
  { href: "/chapters", label: "Chapters", icon: ClipboardList },
  { href: "/quizzes", label: "Quizzes", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/parent", label: "Parent", icon: Users },
  { href: "/parent/ai-review", label: "AI Review", icon: LineChart },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function AppShell({
  children: pageChildren,
  activeChildAvatar = children[0].avatar,
}: {
  children: React.ReactNode;
  activeChildAvatar?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-950">
      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-slate-200 bg-white px-4 py-5 shadow-sm lg:block">
          <Link href="/dashboard" className="mb-7 flex items-center gap-3 rounded-2xl px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">CK</div>
            <div>
              <div className="text-xl font-black leading-5 text-slate-950">ConceptKid</div>
              <div className="text-xs font-bold text-slate-500">AI concept teacher</div>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/parent" className="absolute bottom-5 left-4 right-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">Parent workspace</div>
                <div className="text-xs font-semibold text-slate-500">Reports and actions</div>
              </div>
            </div>
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 xl:px-10">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button className="rounded-xl bg-slate-100 p-2 text-slate-700 lg:hidden" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Welcome back</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Focused learning, homework checks, exams, and parent progress in one place.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a href="mailto:support@conceptkid.in" className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                  <Mail className="h-4 w-4" /> support@conceptkid.in
                </a>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
                  <div className="flex items-center gap-2 border-r border-slate-100 px-3">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <div>
                      <div className="text-sm font-black">1250</div>
                      <div className="text-[10px] font-bold text-slate-500">Stars</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-r border-slate-100 px-3">
                    <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
                    <div>
                      <div className="text-sm font-black">7</div>
                      <div className="text-[10px] font-bold text-slate-500">Day streak</div>
                    </div>
                  </div>
                  <div className="relative px-3">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute right-2 top-0 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl">{activeChildAvatar}</div>
                </div>
              </div>
            </div>

            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.slice(0, 10).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="w-full px-4 py-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
            <div className="w-full max-w-none">
              {pageChildren}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
