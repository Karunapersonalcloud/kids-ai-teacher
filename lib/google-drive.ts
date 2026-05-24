export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
};

const mockDriveFiles: DriveFile[] = [
  { id: "mock-drive-1", name: "Class 9 Maths Textbook.pdf", mimeType: "application/pdf" },
  { id: "mock-drive-2", name: "Harini English Worksheet.png", mimeType: "image/png" },
  { id: "mock-drive-3", name: "Academic Diary April.pdf", mimeType: "application/pdf" },
];

export async function listDriveFiles() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!apiKey || !folderId) {
    return {
      mode: "mock" as const,
      notice: "Google Drive credentials are not configured. Showing demo Drive files.",
      files: mockDriveFiles,
    };
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,webViewLink,modifiedTime)",
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      mode: "mock" as const,
      notice: "Could not read Google Drive right now. Showing demo Drive files.",
      files: mockDriveFiles,
    };
  }

  const data = (await response.json()) as { files?: DriveFile[] };
  return {
    mode: "drive" as const,
    notice: "Loaded files from Google Drive.",
    files: data.files || [],
  };
}

export async function downloadDriveFile(fileId: string, mimeType: string) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return {
      ok: false as const,
      error: "Google Drive API key is not configured yet.",
    };
  }

  if (mimeType.startsWith("application/vnd.google-apps.")) {
    return {
      ok: false as const,
      error: "This is a Google-native file. Please export it as PDF, DOCX, TXT, or PPTX in Drive first, then import again.",
    };
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false as const,
      error: "Could not download this Drive file. Check sharing permissions or use a public/shared file.",
    };
  }

  return {
    ok: true as const,
    data: Buffer.from(await response.arrayBuffer()),
  };
}
