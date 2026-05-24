"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { AlertTriangle, BookDown, CheckCircle2, Download, ExternalLink, FolderOpen, Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";

type NcertBookStatus = {
  id: string;
  childId: string;
  grade: string;
  classNumber: number;
  subject: string;
  bookTitle: string;
  targetFolder: string;
  enabled: boolean;
  localFolderPath: string;
  downloadedCount: number;
  importedCount: number;
  indexedCount: number;
};

type NcertFile = {
  title: string;
  chapterNumber?: number;
  fileName: string;
  downloadUrl: string;
  type: "chapter" | "complete" | "preface" | "appendix" | "unknown";
  status?: "Not downloaded" | "Downloaded" | "Imported" | "Indexed";
};

type CheckResult = {
  book: NcertBookStatus;
  sourceUrl: string;
  status: string;
  message: string;
  files: NcertFile[];
};

export default function NcertPage() {
  const [books, setBooks] = useState<NcertBookStatus[]>([]);
  const [canImportFromDrive, setCanImportFromDrive] = useState(false);
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const [loading, setLoading] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("Loading NCERT book configuration...");

  useEffect(() => {
    refreshBooks();
  }, []);

  async function refreshBooks() {
    const response = await fetch("/api/ncert/books");
    const data = (await response.json()) as { books?: NcertBookStatus[]; notice?: string; canImportFromDrive?: boolean };
    setBooks(data.books || []);
    setCanImportFromDrive(Boolean(data.canImportFromDrive));
    setNotice(data.notice || "NCERT downloader is ready.");
  }

  async function checkBook(bookId: string) {
    setLoading((current) => ({ ...current, [bookId]: "Checking..." }));
    const response = await fetch("/api/ncert/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    const data = (await response.json()) as CheckResult & { error?: string };
    if (response.ok) {
      setChecks((current) => ({ ...current, [bookId]: data }));
      setNotice(data.message);
    } else {
      setNotice(data.error || "NCERT check failed.");
    }
    setLoading((current) => ({ ...current, [bookId]: "" }));
  }

  async function downloadBook(bookId: string) {
    setLoading((current) => ({ ...current, [bookId]: "Downloading..." }));
    const response = await fetch("/api/ncert/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, mode: "all", selectedFileNames: [], forceDownload: false }),
    });
    const data = (await response.json()) as { downloadedCount?: number; skippedCount?: number; failedCount?: number; error?: string };
    setNotice(response.ok ? `Downloaded ${data.downloadedCount || 0}, skipped ${data.skippedCount || 0}, failed ${data.failedCount || 0}.` : data.error || "Download failed.");
    await refreshBooks();
    await checkBook(bookId);
    setLoading((current) => ({ ...current, [bookId]: "" }));
  }

  async function downloadImportIndex(bookId: string) {
    setLoading((current) => ({ ...current, [bookId]: "Downloading + indexing..." }));
    const response = await fetch("/api/ncert/download-import-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    const data = (await response.json()) as { downloadedCount?: number; importedCount?: number; indexedCount?: number; skippedCount?: number; failedCount?: number; error?: string };
    setNotice(
      response.ok
        ? `Downloaded ${data.downloadedCount || 0}, imported ${data.importedCount || 0}, indexed ${data.indexedCount || 0}, skipped ${data.skippedCount || 0}, failed ${data.failedCount || 0}.`
        : data.error || "Download, import, and index failed."
    );
    await refreshBooks();
    await checkBook(bookId);
    setLoading((current) => ({ ...current, [bookId]: "" }));
  }

  return (
    <AppShell>
      <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
              <BookDown className="h-4 w-4" /> Official NCERT/ePathshala sources only
            </div>
            <h1 className="text-3xl font-black tracking-tight text-purple-800 md:text-4xl">NCERT Auto Downloader</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Download official NCERT chapter-wise textbooks, import them, and make them ready for AI teaching.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 lg:max-w-md">
            <AlertTriangle className="mb-2 h-5 w-5" />
            NCERT site structure may change. If detection fails, download manually and upload to the textbook folder. This tool checks/downloads only when you click.
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700">{notice}</div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {books.map((book) => (
          <NcertBookCard
            key={book.id}
            book={book}
            check={checks[book.id]}
            loading={loading[book.id]}
            onCheck={() => checkBook(book.id)}
            onDownload={() => downloadBook(book.id)}
            onDownloadImportIndex={() => downloadImportIndex(book.id)}
            canImportFromDrive={canImportFromDrive}
          />
        ))}
      </div>
    </AppShell>
  );
}

function NcertBookCard({
  book,
  check,
  loading,
  onCheck,
  onDownload,
  onDownloadImportIndex,
  canImportFromDrive,
}: {
  book: NcertBookStatus;
  check?: CheckResult;
  loading?: string;
  onCheck: () => void;
  onDownload: () => void;
  onDownloadImportIndex: () => void;
  canImportFromDrive: boolean;
}) {
  const files = useMemo(() => check?.files || [], [check]);
  const chapterCount = files.filter((file) => file.type === "chapter").length;

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${book.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {book.enabled ? "Enabled" : "Disabled"}
          </span>
          <h2 className="text-2xl font-black text-purple-800">{book.bookTitle}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Jayadeep • Class {book.classNumber} • {book.subject}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-xs font-bold text-blue-700">
          <div>Target: {book.targetFolder}</div>
          <div className="mt-1 max-w-[280px] truncate" title={book.localFolderPath}>{book.localFolderPath || "LOCAL_TEXTBOOK_ROOT missing"}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
        <Metric label="Detected" value={chapterCount || "-"} />
        <Metric label="Downloaded" value={book.downloadedCount} />
        <Metric label="Imported" value={book.importedCount} />
        <Metric label="Indexed" value={book.indexedCount} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton icon={Search} label="Check Availability" loading={loading === "Checking..."} onClick={onCheck} />
        {canImportFromDrive ? (
          <>
            <ActionButton icon={Download} label="Download" loading={loading === "Downloading..."} onClick={onDownload} />
            <ActionButton icon={CheckCircle2} label="Download + Import + Index" loading={loading === "Downloading + indexing..."} onClick={onDownloadImportIndex} primary />
          </>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
            Downloads are restricted. You can learn from this material inside the app.
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
          <FolderOpen className="h-4 w-4" /> View Local Folder
        </span>
        <Link href={`/uploads?subject=${encodeURIComponent(book.subject)}`} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
          View Imported Chapters
        </Link>
      </div>

      {check && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-slate-900">{check.status}</h3>
              <p className="text-xs font-bold text-slate-500">{check.message}</p>
            </div>
            <a href={check.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-blue-700">
              Official page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto">
            {files.map((file) => (
              <div key={file.downloadUrl} className="rounded-xl bg-white p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-900">{file.title}</div>
                    <div className="mt-1 font-semibold text-slate-500">{file.fileName} • {new URL(file.downloadUrl).hostname}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 font-black ${statusTone(file.status)}`}>{file.status || "Not downloaded"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-purple-50 px-3 py-3">
      <div className="text-lg text-purple-800">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, loading, onClick, primary = false }: { icon: ElementType; label: string; loading?: boolean; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black disabled:opacity-60 ${
        primary ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700"
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {loading ? "Working..." : label}
    </button>
  );
}

function statusTone(status?: string) {
  if (status === "Indexed") return "bg-green-100 text-green-700";
  if (status === "Imported") return "bg-blue-100 text-blue-700";
  if (status === "Downloaded") return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-500";
}
