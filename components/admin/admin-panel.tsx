"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import type { AccessRequest } from "@/lib/access-store";
import { normalizeSubmittedSubjects } from "@/lib/student-subjects";

const groups = ["pending", "trial", "active", "expired", "rejected", "blocked"] as const;

export function AdminPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [message, setMessage] = useState("Loading access requests...");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/access-requests");
    const data = (await response.json()) as { requests?: AccessRequest[]; error?: string };
    setRequests(data.requests || []);
    setMessage(response.ok ? "Admin approval panel ready." : data.error || "Admin access required.");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function action(id: string, nextAction: string) {
    const response = await fetch("/api/admin/access-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: nextAction }),
    });
    const data = (await response.json()) as { message?: string; emailSent?: boolean; emailStatus?: string; emailError?: string; error?: string };
    if (response.ok && (nextAction === "approve-trial" || nextAction === "approve-full")) {
      setMessage(data.emailSent ? "Approved and login instructions emailed." : data.emailStatus || data.emailError || "Approved. Email is not configured yet. Use Copy Login Instructions.");
    } else {
      setMessage(response.ok ? data.message || "Access updated." : data.error || "Could not update access.");
    }
    await refresh();
  }

  function copyInstructions(request: AccessRequest) {
    const text = `Your Kids AI Teacher access has been approved.

Login URL: ${window.location.origin}/login
Email/Mobile: ${request.email || request.mobile}
Temporary PIN: ${request.tempPin || "PIN already changed"}

Please login and change your PIN on first login.`;
    navigator.clipboard.writeText(text);
    setMessage("Login instructions copied.");
  }

  const counts = useMemo(() => Object.fromEntries(groups.map((group) => [group, requests.filter((request) => request.status === group).length])), [requests]);

  return (
    <AppShell>
      <PageHeader
        badge="Admin"
        title="Admin Approval Panel"
        subtitle="Approve trials, enable full access, block users, set expiry, manage limits, and review selected children, subjects, and textbook details."
        actions={<div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{message}</div>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {groups.map((group) => (
          <div key={group} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-black text-slate-950">{counts[group]}</div>
            <div className="text-xs font-black uppercase text-slate-500">{group}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
        {requests.map((request) => (
          <article key={request.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                  {request.userType === "internalFamily" ? "Family Admin" : `${request.status} + ${request.plan === "family" ? "family plan" : request.plan}`}
                </span>
                <h2 className="mt-3 text-xl font-black">{request.parentName}</h2>
                <p className="text-sm font-bold text-slate-500">{request.email} • {request.mobile}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                {request.childName}<br />{request.grade} • {request.board}
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6">{request.learningGoal}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-slate-500">
              <span>State: {request.state || "Not provided"}</span>
              <span>Type: {request.userType}</span>
              <span>Status: {request.status}</span>
              <span>Plan: {request.plan}</span>
              <span>AI/day: {request.dailyAiLimit}</span>
              <span>Uploads: {request.uploadLimit}</span>
              <span>Expiry: {request.expiryDate || "None"}</span>
              <span>Must change PIN: {request.mustChangeCredentials ? "Yes" : "No"}</span>
              <span>Last login: {request.lastLoginAt ? new Date(request.lastLoginAt).toLocaleDateString() : "Never"}</span>
              <span>Download: {request.canDownloadMaterials ? "Allowed" : "Restricted"}</span>
              <span>Email: {request.loginEmailStatus || "Not sent"}</span>
            </div>
            {request.loginEmailStatus && (
              <div className={`mt-4 rounded-2xl p-3 text-sm font-bold ${request.loginEmailStatus === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>
                {request.loginEmailStatus === "sent" ? "Approved and login instructions emailed." : request.loginEmailError || "Approved, but email not sent. Use Copy Login Instructions."}
              </div>
            )}
            <div className="mt-4 rounded-2xl bg-blue-50 p-4">
              <div className="text-xs font-black uppercase text-blue-700">Selected Languages</div>
              <div className="mt-2 grid gap-2 text-sm font-bold text-blue-900 sm:grid-cols-2">
                <span>State: {request.state || "Not provided"}</span>
                <span>Board: {request.board}</span>
                <span>Grade: {request.grade}</span>
                <span>R1: {request.r1Language || "Not selected"}</span>
                <span>R2: {request.r2Language || "Not selected"}</span>
                <span>R3: {request.r3Language || "Not selected"}</span>
                <span>Preferred explanation: {request.explanationLanguage}</span>
              </div>
              <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-black ${request.cbseLanguageValidationStatus === "Valid" ? "bg-green-100 text-green-700" : request.cbseLanguageValidationStatus === "Invalid combination" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                CBSE language validation: {request.cbseLanguageValidationStatus || "Needs school confirmation"}
                {request.cbseLanguageRuleWarning ? ` - ${request.cbseLanguageRuleWarning}` : ""}
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-green-50 p-4">
              <div className="text-xs font-black uppercase text-green-700">Selected Subjects and Textbooks</div>
              <div className="mt-3 grid gap-2">
                {normalizeSubmittedSubjects(request.submittedSubjects).length ? (
                  normalizeSubmittedSubjects(request.submittedSubjects).map((subject, index) => (
                    <div key={`${subject.subjectName}-${index}`} className="rounded-xl bg-white p-3 text-sm font-bold text-slate-700">
                      <div className="font-black text-green-800">
                        {subject.languageRole !== "Not Applicable" ? `${subject.languageRole} ` : ""}
                        {subject.subjectName}
                      </div>
                      <div className="mt-1 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                        <span>Type: {subject.subjectType}</span>
                        <span>Language: {subject.language || "Not applicable"}</span>
                        <span>Publisher: {subject.publisher}</span>
                        <span>Book: {subject.bookTitle || "Not provided"}</span>
                        <span>Medium: {subject.medium}</span>
                        <span>Auto NCERT: {subject.autoDownloadAllowed ? "Allowed" : "No"}</span>
                        <span>Status: {subject.sourceStatus}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-white p-3 text-sm font-bold text-slate-500">No submitted subject list yet.</div>
                )}
              </div>
            </div>
            {request.tempPin && request.mustChangeCredentials && (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                <div className="text-xs font-black uppercase text-amber-700">Temporary credentials</div>
                <div className="mt-2 grid gap-2 text-sm font-bold text-amber-900 sm:grid-cols-2">
                  <span>Email/Mobile: {request.email || request.mobile}</span>
                  <span>Temporary PIN: {request.tempPin}</span>
                  <span>Plan: {request.plan}</span>
                  <span>AI/day: {request.dailyAiLimit}</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${request.mustChangeCredentials ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                {request.mustChangeCredentials ? "Must change PIN" : "Credential changed"}
              </span>
              {["canUseAI", "canUploadMaterials", "canIndexMaterials", "canImportFromDrive", "canDownloadMaterials"].map((key) => (
                <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {key.replace("can", "")}: {request[key as keyof AccessRequest] ? "yes" : "no"}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => action(request.id, "approve-trial")} className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">Approve Trial</button>
              <button onClick={() => action(request.id, "approve-full")} className="rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white">Approve Full Access</button>
              <button onClick={() => action(request.id, "reject")} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700">Reject</button>
              <button onClick={() => action(request.id, "block")} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Block</button>
              <button onClick={() => action(request.id, "extend")} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Extend Access</button>
              <button onClick={() => action(request.id, "set-limit")} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Set Daily AI Limit</button>
              <button onClick={() => action(request.id, "mark-upload-required")} className="rounded-full bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">Mark textbook upload required</button>
              <button onClick={() => action(request.id, "trigger-ncert-download")} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Trigger NCERT Download</button>
              <button onClick={() => action(request.id, "reset-pin")} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700">Reset PIN/password</button>
              <button onClick={() => copyInstructions(request)} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-black text-white">Copy Login Instructions</button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
