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
  Flame,
  Home,
  LineChart,
  Mail,
  ShieldCheck,
  Star,
  UploadCloud,
  Users,
} from "lucide-react";
import { children } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/subjects", label: "My Subjects", icon: BookOpen },
  { href: "/ai-teacher", label: "AI Teacher", icon: Bot },
  { href: "/uploads", label: "Uploads", icon: UploadCloud },
  { href: "/ncert", label: "NCERT Books", icon: BookDown },
  { href: "/quizzes", label: "Quizzes", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/visual-learning", label: "Visual Learning", icon: Star },
  { href: "/parent", label: "Parent Mode", icon: Users },
  { href: "/parent/ai-review", label: "AI Review", icon: CalendarDays },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "#messages", label: "Messages", icon: Mail },
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
    <div className="min-h-screen bg-[#f7f5ff] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="relative hidden w-[250px] shrink-0 border-r border-purple-100 bg-white px-5 py-6 lg:block">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-sm">🤖</div>
            <div>
              <div className="text-2xl font-black leading-5">
                <span className="text-orange-400">K</span>
                <span className="text-green-500">i</span>
                <span className="text-blue-500">d</span>
                <span className="text-yellow-500">s</span> <span className="text-purple-600">AI</span>
              </div>
              <div className="text-sm font-semibold text-purple-500">Teacher</div>
            </div>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-200"
                      : "text-slate-700 hover:bg-purple-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/parent" className="absolute bottom-8 left-5 w-[210px] rounded-2xl bg-purple-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-200 text-purple-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Parent Mode</div>
                <div className="text-xs text-slate-500">Manage & Monitor</div>
              </div>
            </div>
          </Link>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight md:text-4xl">
                <span>👋</span> Welcome back!
              </h1>
              <p className="mt-1 text-slate-500">Let’s learn, explore and grow together! 🚀</p>
            </div>

            <div className="flex items-center rounded-2xl bg-white px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2 border-r border-slate-100 px-3">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <div>
                  <div className="font-black">1250</div>
                  <div className="text-xs text-slate-500">Stars</div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-r border-slate-100 px-3">
                <Flame className="h-6 w-6 fill-orange-500 text-orange-500" />
                <div>
                  <div className="font-black">7</div>
                  <div className="text-xs text-slate-500">Day Streak</div>
                </div>
              </div>
              <div className="relative px-3">
                <Bell className="h-6 w-6" />
                <span className="absolute right-2 top-0 h-3 w-3 rounded-full bg-pink-500" />
              </div>
              <div className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-2xl">{activeChildAvatar}</div>
            </div>
          </header>

          {pageChildren}
        </main>
      </div>
    </div>
  );
}
