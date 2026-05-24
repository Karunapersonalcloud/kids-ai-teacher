import { redirect } from "next/navigation";
import { ExamClient } from "@/components/chapter/exam-client";

export const dynamic = "force-dynamic";

type SearchParams = { childId?: string; chapterId?: string };

export default async function ExamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  if (!params.childId || !params.chapterId) redirect("/chapters");
  return <ExamClient childId={params.childId} chapterId={params.chapterId} />;
}
