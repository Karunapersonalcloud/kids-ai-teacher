import { BookOpenCheck, ClipboardList, GraduationCap, LineChart, Play, SearchCheck, Sparkles, UserRoundPlus } from "lucide-react";

const walkthroughSteps = [
  { title: "Parent registers child", icon: UserRoundPlus },
  { title: "Select grade, subjects, publishers/books", icon: BookOpenCheck },
  { title: "App checks student level", icon: SearchCheck },
  { title: "App teaches visually", icon: Sparkles },
  { title: "Student practices", icon: ClipboardList },
  { title: "Chapter exam checks mastery", icon: GraduationCap },
  { title: "Parent tracks progress", icon: LineChart },
];

export function DemoVideo() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-blue-900 p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.22),transparent_34%),radial-gradient(circle_at_75%_80%,rgba(216,180,254,0.18),transparent_30%)]" />
          <div className="relative text-center">
            <button className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-purple-700 shadow-lg" aria-label="Demo video coming soon">
              <Play className="ml-1 h-9 w-9 fill-purple-700" />
            </button>
            <h2 className="mt-5 text-3xl font-black">2-minute walkthrough</h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-purple-100">
              Demo video coming soon - preview the workflow below.
            </p>
          </div>
        </div>

        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Parent workflow</span>
          <h3 className="mt-4 text-2xl font-black text-slate-950">From registration to mastery, in one clear path</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {walkthroughSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-purple-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400">Step {index + 1}</div>
                    <div className="text-sm font-black leading-5 text-slate-800">{step.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
