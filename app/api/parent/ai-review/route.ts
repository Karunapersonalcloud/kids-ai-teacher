import OpenAI from "openai";
import { children, getSubjectsForChild } from "@/lib/mock-data";
import { readUploadRecords } from "@/lib/local-uploads";
import { readProgressRecords } from "@/lib/progress-store";

export const runtime = "nodejs";

export async function POST() {
  const [uploads, progress] = await Promise.all([readUploadRecords(), readProgressRecords()]);
  const materialsNotIndexed = uploads.filter((upload) => (upload.indexStatus || upload.status) !== "Indexed");
  const subjectsWithoutTextbook = children.flatMap((child) =>
    getSubjectsForChild(child.id)
      .filter((subject) => !uploads.some((upload) => upload.childId === child.id && upload.subject === subject.name && upload.materialType === "Textbook"))
      .map((subject) => `${child.name}: ${subject.name}`)
  );
  const weakAreas = progress.flatMap((record) => record.weakConcepts.map((concept) => `${record.childId}: ${concept}`));
  const diaryMissing = children
    .filter((child) => !uploads.some((upload) => upload.childId === child.id && upload.materialType === "Academic Diary"))
    .map((child) => `${child.name}: academic diary missing`);
  const baseSummary = [
    materialsNotIndexed.length ? `${materialsNotIndexed.length} uploaded material(s) still need AI indexing.` : "All uploaded local materials are indexed or demo-only.",
    subjectsWithoutTextbook.length ? `Subjects without textbook uploads: ${subjectsWithoutTextbook.slice(0, 6).join(", ")}.` : "Core textbook coverage looks good.",
    diaryMissing.length ? diaryMissing.join(". ") : "Academic diary upload is available.",
    weakAreas.length ? `Recent weak areas: ${weakAreas.slice(-5).join(", ")}.` : "No saved quiz weak areas yet.",
    "Today: upload missing diary/textbooks, index readable files, do one 20-minute reading block, and save one quiz result.",
  ].join(" ");

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ mode: "mock", summary: baseSummary, materialsNotIndexed, subjectsWithoutTextbook, diaryMissing, weakAreas });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a supportive parent learning advisor. Give concise, practical actions. Do not shame children.",
      },
      {
        role: "user",
        content: `Review this upload/progress state and suggest parent actions: ${JSON.stringify({ uploads, progress, materialsNotIndexed, subjectsWithoutTextbook, diaryMissing, weakAreas })}`,
      },
    ],
  });

  return Response.json({ mode: "openai", summary: completion.choices[0]?.message.content || baseSummary, materialsNotIndexed, subjectsWithoutTextbook, diaryMissing, weakAreas });
}
