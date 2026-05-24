import { Suspense } from "react";
import { AITeacherClient } from "@/components/ai/ai-teacher-client";

export default function AITeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5ff] p-6 font-bold text-purple-700">Loading AI Teacher...</div>}>
      <AITeacherClient />
    </Suspense>
  );
}
