import { VisualLearningClient } from "@/components/ai/visual-learning-client";

type VisualLearningPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VisualLearningPage({ searchParams }: VisualLearningPageProps) {
  const params = await searchParams;
  const initialParams = {
    child: firstParam(params?.child),
    subject: firstParam(params?.subject),
    chapter: firstParam(params?.chapter),
    concept: firstParam(params?.concept),
    topic: firstParam(params?.topic),
  };

  return <VisualLearningClient initialParams={initialParams} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
