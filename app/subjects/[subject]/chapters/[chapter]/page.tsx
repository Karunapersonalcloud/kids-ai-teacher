import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { getChapterPack } from "@/lib/chapter-catalog";
import { children, getChild, getSubjectBySlug } from "@/lib/mock-data";
import type { ChildId } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageParams = { subject: string; chapter: string };
type SearchParams = { child?: string; chapterId?: string };

export default async function SubjectChapterPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { subject: subjectSlug, chapter } = await params;
  const query = await searchParams;
  const childId = (children.some((item) => item.id === query.child) ? query.child : "jayadeep") as ChildId;
  const child = getChild(childId);
  const subject = getSubjectBySlug(subjectSlug);
  const chapterTitle = decodeURIComponent(chapter).replaceAll("-", " ");
  const pack = query.chapterId ? getChapterPack(query.chapterId) : undefined;

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <div className="w-full max-w-none space-y-5">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <p className="text-sm font-black text-purple-700">{subject.name} · {child.name} · {child.grade}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{pack?.chapter || titleCase(chapterTitle)}</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Every chapter starts with a prerequisite pre-check, then visual learning, practice, CBSE-style exam, and weak-area recovery until 95% mastery.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pack ? (
              <>
                <Link href={`/chapters/precheck?childId=${childId}&chapterId=${pack.chapterId}`} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white">
                  Start pre-check
                </Link>
                <Link href={`/chapters/exam?childId=${childId}&chapterId=${pack.chapterId}`} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                  Chapter exam
                </Link>
              </>
            ) : (
              <Link href={`/ai-teacher?subject=${subject.slug}&child=${childId}`} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white">
                Teach with AI
              </Link>
            )}
          </div>
        </header>

        <nav className="grid gap-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-purple-100 sm:grid-cols-3 lg:grid-cols-6">
          {["Pre-check", "Learn Visually", "Practice", "Exam", "Weak Areas", "Homework"].map((tab) => (
            <a key={tab} href={`#${tab.toLowerCase().replaceAll(" ", "-")}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-purple-50">
              {tab}
            </a>
          ))}
        </nav>

        <section id="pre-check" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <FlowCard title="1. Pre-check" badge="Required first" text="Answer 5-10 prerequisite questions. If basics are weak, ConceptKid teaches foundation recovery before the chapter." />
          <SideNote title="Readiness states" items={["Ready", "Needs basics", "Needs revision", "High risk"]} />
        </section>

        <section id="learn-visually" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <h2 className="text-xl font-black text-slate-950">2. Learn visually</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VisualCard title="Simple explanation" text={pack?.description || `Understand ${subject.name} with clear, grade-level language.`} />
            <VisualCard title="Real-life example" text="Connect the idea to school, home, travel, food, games, or daily objects." />
            <VisualCard title="Step-by-step" text="Break the concept into small steps with one worked example." />
            <VisualCard title="Memory trick" text="Use a short trick to remember the key idea before practice." />
          </div>
        </section>

        <section id="practice" className="grid gap-5 md:grid-cols-2">
          <FlowCard title="3. Practice" badge="Low pressure" text="Small questions follow immediately after teaching. The child learns from mistakes before a test." />
          <FlowCard title="4. Quick check" badge="Adaptive" text="AI asks one check question and adjusts the next explanation based on the answer." />
        </section>

        <section id="exam" className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <h2 className="text-xl font-black">5. CBSE-style chapter exam</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            MCQ, short answer, competency questions, case-based questions for higher classes, and strict scoring. A chapter is mastered only at 95% or above.
          </p>
        </section>

        <section id="weak-areas" className="grid gap-5 md:grid-cols-2">
          <FlowCard title="6. Weak-area strengthening" badge="If below 95%" text="ConceptKid identifies weak concepts, creates a backlog plan, and unlocks retest after targeted revision." />
          <FlowCard title="7. Homework correction" badge="Parent upload" text="Upload homework or exam answer photos. Unclear images are flagged; corrections are explained." href="/homework" />
        </section>
      </div>
    </AppShell>
  );
}

function FlowCard({ title, text, badge, href }: { title: string; text: string; badge: string; href?: string }) {
  const content = (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">{badge}</span>
      <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </article>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function SideNote({ title, items }: { title: string; items: string[] }) {
  return (
    <aside className="rounded-3xl bg-purple-50 p-6 text-purple-800">
      <h3 className="text-sm font-black">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm font-bold">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </aside>
  );
}

function VisualCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-3xl bg-slate-50 p-4">
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
