"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Brain, Cloud, Search, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect, MaterialTypeSelect, SubjectSelect } from "@/components/shared/controls";
import { getChild, getSubjectsForChild, materialTypes, mockUploads } from "@/lib/mock-data";
import type { ChildId, MaterialType, UploadRecord } from "@/lib/types";

type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime?: string };
type LocalFolderScan = {
  folderKey: string;
  folderPath: string;
  childId: ChildId;
  childName: string;
  grade: string;
  subject: string;
  languageRole?: "R1" | "R2" | "R3";
  materialType: MaterialType;
  exists: boolean;
  message?: string;
  filesCount: number;
  detectedChapterCount: number;
  status: "Not imported" | "Partially imported" | "Imported" | "Indexed";
  files: {
    fileName: string;
    extension: string;
    size: number;
    modifiedTime: string;
    guessedChapterNumber?: number;
    guessedChapterTitle: string;
    importStatus: "Not imported" | "Imported" | "Indexed";
  }[];
};

export function UploadManager() {
  const [childId, setChildId] = useState<ChildId>("jayadeep");
  const [subject, setSubject] = useState(getSubjectsForChild("jayadeep")[0].name);
  const [materialType, setMaterialType] = useState<MaterialType>(materialTypes[0]);
  const [chapter, setChapter] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<UploadRecord[]>(mockUploads);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveNotice, setDriveNotice] = useState("");
  const [localFolders, setLocalFolders] = useState<LocalFolderScan[]>([]);
  const [localNotice, setLocalNotice] = useState("");
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedDriveIds, setImportedDriveIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChild, setFilterChild] = useState<ChildId | "all">("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [status, setStatus] = useState("Ready to upload.");
  const child = getChild(childId);
  const grade = child.grade;

  const acceptedTypes = useMemo(() => ".pdf,.docx,.pptx,.jpg,.jpeg,.png,.txt,.xlsx", []);

  useEffect(() => {
    fetch("/api/uploads")
      .then((response) => response.json())
      .then((data: { uploads?: UploadRecord[] }) => {
        if (data.uploads?.length) setRecords(data.uploads);
      })
      .catch(() => undefined);
    fetchDriveFiles();
    scanLocalFolders();
  }, []);

  function fetchDriveFiles() {
    fetch("/api/drive/files")
      .then((response) => response.json())
      .then((data: { files?: DriveFile[]; notice?: string }) => {
        setDriveFiles(data.files || []);
        setDriveNotice(data.notice || "");
      })
      .catch(() => undefined);
  }

  async function scanLocalFolders() {
    const response = await fetch("/api/local-textbooks/scan");
    const data = (await response.json()) as { folders?: LocalFolderScan[]; message?: string };
    setLocalFolders(data.folders || []);
    setLocalNotice(data.message || "");
  }

  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("childId", childId);
    formData.set("grade", grade);
    formData.set("subject", subject);
    formData.set("materialType", materialType);
    formData.set("chapter", chapter);
    formData.set("notes", notes);

    setStatus("Uploading...");
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = (await response.json()) as { upload?: UploadRecord; error?: string };
    if (!response.ok || !data.upload) {
      setStatus(data.error || "Upload failed.");
      return;
    }

    setRecords((current) => [data.upload!, ...current]);
    setFile(null);
    setChapter("");
    setNotes("");
    setStatus("Uploaded and ready for AI indexing.");
  }

  async function indexForAI(record: UploadRecord) {
    setIndexingId(record.id);
    setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, indexStatus: "Parsing" } : item)));
    const response = await fetch("/api/materials/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: record.id }),
    });
    const data = (await response.json()) as { error?: string; chunksIndexed?: number };
    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              status: response.ok ? "Indexed" : item.status,
              indexStatus: response.ok ? "Indexed" : "Failed",
              indexError: data.error,
            }
          : item
      )
    );
    setStatus(response.ok ? `Indexed ${data.chunksIndexed || 0} chunks for AI.` : data.error || "Indexing failed.");
    setIndexingId(null);
  }

  async function importDriveFile(file: DriveFile, indexAfterImport: boolean) {
    setImportingId(file.id);
    setStatus(indexAfterImport ? "Importing and indexing Drive file..." : "Importing Drive file...");
    const response = await fetch("/api/drive/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        childId,
        grade,
        subject,
        materialType,
        chapter,
        notes,
        indexAfterImport,
      }),
    });
    const data = (await response.json()) as { upload?: UploadRecord; error?: string; warning?: string };
    if (!response.ok || !data.upload) {
      setStatus(data.error || "Drive import failed.");
      setImportingId(null);
      return;
    }

    setRecords((current) => [data.upload!, ...current]);
    setImportedDriveIds((current) => [...new Set([...current, file.id])]);
    setStatus(data.warning || (indexAfterImport ? "Imported and indexed Drive file." : "Imported Drive file. It is ready for AI indexing."));
    setImportingId(null);
  }

  async function importLocalFolder(folder: LocalFolderScan, indexAfterImport: boolean) {
    setImportingId(folder.folderKey);
    setStatus(indexAfterImport ? `Importing and indexing ${folder.subject} textbooks...` : `Importing ${folder.subject} textbooks...`);
    const response = await fetch(indexAfterImport ? "/api/local-textbooks/import-and-index" : "/api/local-textbooks/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderKey: folder.folderKey, importMode: "all", fileNames: [] }),
    });
    const data = (await response.json()) as { imported?: UploadRecord[]; error?: string; importedCount?: number; indexedCount?: number; failedCount?: number };
    if (!response.ok) {
      setStatus(data.error || "Local textbook import failed.");
      setImportingId(null);
      return;
    }

    setStatus(indexAfterImport ? `Imported ${data.importedCount || 0}, indexed ${data.indexedCount || 0}, failed ${data.failedCount || 0}.` : `Imported ${data.importedCount || 0} textbook files.`);
    fetch("/api/uploads")
      .then((result) => result.json())
      .then((result: { uploads?: UploadRecord[] }) => setRecords(result.uploads || records))
      .catch(() => undefined);
    await scanLocalFolders();
    setImportingId(null);
  }

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || `${record.fileName} ${record.subject} ${record.materialType} ${record.chapter} ${record.notes}`.toLowerCase().includes(query);
    const matchesChild = filterChild === "all" || record.childId === filterChild;
    const matchesSubject = filterSubject === "all" || record.subject === filterSubject;
    const matchesType = filterType === "all" || record.materialType === filterType;
    return matchesQuery && matchesChild && matchesSubject && matchesType;
  });

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-purple-700">Local Textbook Folders</h2>
            <p className="text-sm font-semibold text-slate-500">{localNotice || "Automatically detect chapter-wise textbook PDFs from your PC."}</p>
          </div>
          <button onClick={scanLocalFolders} className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-black text-white">Scan</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {localFolders.map((folder) => (
            <article key={folder.folderKey} className="rounded-2xl bg-purple-50 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-purple-900">{folder.grade} {folder.subject}</h3>
                  <p className="text-xs font-bold text-slate-500">{folder.childName}{folder.languageRole ? ` • ${folder.languageRole}` : ""}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">{folder.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                <span>{folder.filesCount} files</span>
                <span>{folder.detectedChapterCount} chapters</span>
              </div>
              {folder.message && <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-amber-700">{folder.message}</div>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={!folder.exists || importingId === folder.folderKey} onClick={() => importLocalFolder(folder, false)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-purple-700 disabled:opacity-50">
                  Import All
                </button>
                <button disabled={!folder.exists || importingId === folder.folderKey} onClick={() => importLocalFolder(folder, true)} className="rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
                  Import & Index All
                </button>
                <button onClick={() => setExpandedFolder(expandedFolder === folder.folderKey ? null : folder.folderKey)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700">
                  View Files
                </button>
              </div>
              {expandedFolder === folder.folderKey && (
                <div className="mt-4 max-h-64 space-y-2 overflow-auto rounded-xl bg-white p-3">
                  {folder.files.length === 0 && <div className="text-xs font-bold text-slate-500">No textbook files detected in this folder.</div>}
                  {folder.files.map((file) => (
                    <div key={file.fileName} className="rounded-lg bg-slate-50 p-2 text-xs">
                      <div className="font-black">{file.guessedChapterTitle}</div>
                      <div className="font-semibold text-slate-500">{file.fileName} • {file.extension} • {formatBytes(file.size)}</div>
                      <div className="mt-1 font-bold text-purple-700">{file.importStatus}</div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submitUpload} className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="mb-4 flex items-center gap-2 text-2xl font-black text-purple-700">
            <UploadCloud className="h-6 w-6" /> Upload & Study Materials
          </h1>
          <label className="mb-4 flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-5 text-center hover:bg-blue-100">
            <input type="file" accept={acceptedTypes} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <UploadCloud className="mb-3 h-14 w-14 text-blue-500" />
            <div className="font-black text-blue-700">{file ? file.name : "Drag & drop files here or click to browse"}</div>
            <div className="mt-2 text-sm font-semibold text-slate-500">PDF, DOCX, PPTX, JPG, PNG, TXT, XLSX</div>
          </label>

          <div className="grid gap-3">
            <ChildSelect
              value={childId}
              onChange={(nextChild) => {
                setChildId(nextChild);
                setSubject(getSubjectsForChild(nextChild)[0].name);
              }}
            />
            <input className="rounded-xl border border-purple-100 bg-slate-50 px-4 py-3 font-bold text-slate-600" value={grade} readOnly />
            <SubjectSelect childId={childId} value={subject} onChange={setSubject} />
            <MaterialTypeSelect value={materialType} onChange={(value) => setMaterialType(value as MaterialType)} />
            <input className="rounded-xl border border-purple-100 px-4 py-3 font-semibold shadow-sm" value={chapter} onChange={(event) => setChapter(event.target.value)} placeholder="Chapter / topic title" />
            <textarea className="min-h-24 rounded-xl border border-purple-100 px-4 py-3 font-semibold shadow-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes for AI teacher or parent" />
            <button className="rounded-xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm hover:bg-purple-700">Upload Material</button>
            <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700">{status}</div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-700">
              OCR note: text extraction from images depends on image clarity. PPTX indexing uses partial slide text extraction.
            </div>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3">
            <h2 className="text-xl font-black text-purple-700">Recent Files</h2>
            <div className="grid gap-2 md:grid-cols-4">
              <label className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-purple-500" />
                <input className="min-w-0 flex-1 text-sm font-semibold outline-none" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search files" />
              </label>
              <select className="rounded-xl border border-purple-100 px-3 py-2 text-sm font-bold" value={filterChild} onChange={(event) => setFilterChild(event.target.value as ChildId | "all")}>
                <option value="all">All children</option>
                <option value="jayadeep">Jayadeep</option>
                <option value="harini">Harini</option>
              </select>
              <select className="rounded-xl border border-purple-100 px-3 py-2 text-sm font-bold" value={filterSubject} onChange={(event) => setFilterSubject(event.target.value)}>
                <option value="all">All subjects</option>
                {Array.from(new Set(records.map((record) => record.subject))).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select className="rounded-xl border border-purple-100 px-3 py-2 text-sm font-bold" value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                <option value="all">All material types</option>
                {materialTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredRecords.length === 0 && (
              <div className="rounded-2xl bg-purple-50 p-5 text-sm font-bold text-purple-700 md:col-span-2">
                No files match these filters yet. Try clearing search or uploading a material.
              </div>
            )}
            {filteredRecords.map((record) => (
              <article key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{record.fileName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {record.subject} • {record.materialType} • {record.sizeLabel}
                    </p>
                  </div>
                  <span className={`rounded-full bg-white px-3 py-1 text-xs font-black ${getIndexTone(record.indexStatus || record.status)}`}>{record.indexStatus || record.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                  <span>{getChild(record.childId).name}</span>
                  <span>{record.grade}</span>
                  <span>{record.chapter || "No chapter"}</span>
                  <span>{record.source || "Local Upload"}</span>
                </div>
                {record.indexError && <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{record.indexError}</div>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => indexForAI(record)}
                    disabled={indexingId === record.id || record.indexStatus === "Indexed"}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Brain className="h-4 w-4" /> {indexingId === record.id ? "Indexing..." : record.indexStatus === "Indexed" ? "Indexed" : "Index for AI"}
                  </button>
                  <Link href={`/ai-teacher?child=${record.childId}&subject=${encodeURIComponent(record.subject)}&fileId=${record.id}`} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                    Teach from this material
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-black text-purple-700">Google Drive Textbooks</h2>
            <p className="text-sm font-semibold text-slate-500">{driveNotice || "Drive discovery is ready."}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {driveFiles.map((file) => (
            <article key={file.id} className="rounded-2xl bg-blue-50 p-4">
              <span className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${importedDriveIds.includes(file.id) ? "bg-green-100 text-green-700" : "bg-white text-blue-700"}`}>
                {importedDriveIds.includes(file.id) ? "Imported" : "Detected"}
              </span>
              <h3 className="font-black text-blue-900">{file.name}</h3>
              <p className="mt-1 text-xs font-bold text-blue-700">{file.mimeType}</p>
              {file.modifiedTime && <p className="mt-1 text-xs font-semibold text-slate-500">Modified {new Date(file.modifiedTime).toLocaleDateString()}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {file.webViewLink && (
                  <a href={file.webViewLink} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700">
                    Open Drive file
                  </a>
                )}
                <button
                  onClick={() => importDriveFile(file, false)}
                  disabled={importingId === file.id}
                  className="rounded-full bg-white px-3 py-2 text-xs font-black text-purple-700 disabled:opacity-60"
                >
                  {importingId === file.id ? "Importing..." : "Import"}
                </button>
                <button
                  onClick={() => importDriveFile(file, true)}
                  disabled={importingId === file.id}
                  className="rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                >
                  Import & Index
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function getIndexTone(status: string) {
  if (status === "Indexed") return "text-green-700";
  if (status === "Parsing") return "text-blue-700";
  if (status === "Failed") return "text-red-700";
  return "text-purple-700";
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
