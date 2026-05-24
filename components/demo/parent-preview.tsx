import { ArrowRight, BarChart3, CalendarCheck, CircleAlert, ClipboardCheck } from "lucide-react";

const progress = [
  { subject: "EVS", value: 70, color: "bg-green-500" },
  { subject: "Maths", value: 60, color: "bg-blue-500" },
  { subject: "English", value: 75, color: "bg-purple-500" },
];

export function ParentPreview() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Parent dashboard preview</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Know what to do today</h2>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600">
          Demo Student - Class 2
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl bg-[#f7f5ff] p-5">
          <div className="flex items-center gap-2 text-sm font-black text-purple-700">
            <CalendarCheck className="h-5 w-5" />
            Today&apos;s Plan
          </div>
          <ul className="mt-4 grid gap-3 text-sm font-bold text-slate-700">
            <li>10 min visual lesson</li>
            <li>5 practice questions</li>
            <li>1 homework check</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <BarChart3 className="h-5 w-5" />
            Progress
          </div>
          <div className="mt-4 grid gap-4">
            {progress.map((item) => (
              <div key={item.subject}>
                <div className="mb-1 flex justify-between text-xs font-black text-slate-600">
                  <span>{item.subject}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-amber-800">
            <CircleAlert className="h-5 w-5" />
            Weak Areas
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Word problems", "Reading comprehension"].map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-800">{item}</span>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500">
              <ClipboardCheck className="h-4 w-4" />
              Next Action
            </div>
            <p className="mt-2 text-sm font-black leading-6 text-slate-800">Practice 10 questions before chapter test.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-purple-600 p-4 text-white">
        <span className="text-sm font-black">Parent sees progress, weak areas, and the next best step.</span>
        <ArrowRight className="h-5 w-5" />
      </div>
    </section>
  );
}
