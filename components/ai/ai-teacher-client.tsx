"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect, SubjectSelect } from "@/components/shared/controls";
import { children, getSubjectsForChild, learningModes } from "@/lib/mock-data";
import type { ChildId } from "@/lib/types";

type ChatMessage = { role: "child" | "ai"; content: string; grounded?: boolean; groundedLabel?: string; sources?: { fileName: string; chapter?: string; source?: string }[] };

export function AITeacherClient() {
  const searchParams = useSearchParams();
  const initialChild = (searchParams.get("child") || "jayadeep") as ChildId;
  const initialSubject = searchParams.get("subject") || getSubjectsForChild(initialChild)[0].name;
  const initialFileId = searchParams.get("fileId") || "all";
  const [childId, setChildId] = useState<ChildId>(initialChild);
  const [subject, setSubject] = useState(initialSubject);
  const [mode, setMode] = useState(learningModes[0]);
  const [materialFilter, setMaterialFilter] = useState<"subject" | "all">("subject");
  const [fileId, setFileId] = useState(initialFileId);
  const [input, setInput] = useState("Explain fractions from basics");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "Hi! I am your AI private teacher. Ask me any doubt, and I will explain gently with examples.",
    },
  ]);

  const child = children.find((item) => item.id === childId) || children[0];

  async function sendMessage(message = input) {
    if (!message.trim()) return;
    const userMessage: ChatMessage = { role: "child", content: message };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    const response = await fetch("/api/ai-teacher/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, subject, mode, message, materialFilter, fileId }),
    });
    const data = (await response.json()) as { answer: string; mode?: string; grounded?: boolean; groundedLabel?: string; sources?: { fileName: string; chapter?: string; source?: string }[] };
    setMessages((current) => [...current, { role: "ai", content: data.answer, grounded: data.grounded, groundedLabel: data.groundedLabel, sources: data.sources }]);
    setLoading(false);
  }

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-purple-700">
            <Bot className="h-6 w-6" /> AI Teacher Setup
          </h2>
          <div className="space-y-4">
            <ChildSelect
              value={childId}
              onChange={(nextChild) => {
                setChildId(nextChild);
                setSubject(getSubjectsForChild(nextChild)[0].name);
              }}
              className="w-full"
            />
            <SubjectSelect childId={childId} value={subject} onChange={setSubject} className="w-full" />
            <select className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={mode} onChange={(event) => setMode(event.target.value)}>
              {learningModes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value as "subject" | "all")}>
              <option value="subject">Selected subject materials</option>
              <option value="all">All indexed materials</option>
            </select>
            <input className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={fileId} onChange={(event) => setFileId(event.target.value)} placeholder="Optional uploaded file id, or all" />
          </div>

          <div className="mt-6 rounded-2xl bg-purple-50 p-4">
            <div className="font-black text-purple-700">Prompt ideas</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Explain atoms", "I don't understand nouns", "Teach fractions with pizza", "Ask me 3 questions"].map((idea) => (
                <button key={idea} onClick={() => sendMessage(idea)} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-purple-700 shadow-sm">
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">🤖</div>
              <div>
                <h1 className="text-2xl font-black">AI Teacher for {child.name}</h1>
                <p className="text-white/85">{subject} • {mode}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "child" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${message.role === "child" ? "bg-purple-600 text-white" : "bg-white text-slate-700"}`}>
                  {message.grounded && (
                    <div className="mb-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                      {message.groundedLabel || "Grounded in uploaded study materials"}
                    </div>
                  )}
                  {message.content}
                  {!!message.sources?.length && (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-xs font-bold text-slate-500">
                      Sources: {message.sources.map((source) => source.fileName).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow-sm">
                <Sparkles className="h-4 w-4" /> AI teacher is thinking...
              </div>
            )}
          </div>

          <form
            className="mt-4 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input className="min-w-0 flex-1 rounded-xl border border-purple-100 px-4 py-3 font-semibold shadow-sm" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your doubt here..." />
            <button className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm hover:bg-purple-700">
              <Send className="h-5 w-5" /> Send
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
