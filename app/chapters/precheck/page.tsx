import { redirect } from "next/navigation";
import { PrecheckClient } from "@/components/chapter/precheck-client";

export const dynamic = "force-dynamic";

type SearchParams = { childId?: string; chapterId?: string };

export default async function PrecheckPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  if (!params.childId || !params.chapterId) redirect("/chapters");
  return <PrecheckClient childId={params.childId} chapterId={params.chapterId} />;
}
