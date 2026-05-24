"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChildId } from "@/lib/types";

export function SubjectActions({
  childId,
  subject,
  subjectSlug,
  chapter,
  chapterNumber,
  concept,
}: {
  childId: ChildId;
  subject: string;
  subjectSlug: string;
  chapter: string;
  chapterNumber?: number;
  concept?: string;
}) {
  const [message, setMessage] = useState("");

  async function postProgress(url: string, body: object, success: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? success : "Could not save progress.");
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => postProgress("/api/progress/lesson-complete", { childId, subject, lesson: chapter }, "Lesson saved as complete.")}
          className="rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white"
        >
          Teach this topic
        </button>
        <Link
          href={`/visual-learning?subject=${subjectSlug}&child=${childId}${chapterNumber ? `&chapter=${chapterNumber}` : ""}${concept ? `&concept=${encodeURIComponent(concept)}` : `&topic=${encodeURIComponent(chapter)}`}`}
          className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
        >
          Create visual lesson
        </Link>
        <Link href={`/quizzes?subject=${subjectSlug}&child=${childId}`} className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
          Generate quiz
        </Link>
        <button
          onClick={() => postProgress("/api/progress/revision", { childId, subject, topic: chapter }, "Revision saved.")}
          className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"
        >
          Mark as revised
        </button>
      </div>
      {message && <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-purple-700">{message}</div>}
    </div>
  );
}
