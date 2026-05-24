import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

export async function extractTextFromFile(filePath: string, fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".txt") {
    return fs.readFile(filePath, "utf8");
  }

  if (extension === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (extension === ".pptx") {
    return extractTextFromPptx(filePath);
  }

  if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    return extractTextWithOcr(filePath);
  }

  if (extension === ".xlsx") {
    return "";
  }

  return "";
}

export function getParserSupportLabel(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  if ([".pdf", ".docx", ".txt"].includes(extension)) {
    return "Text extraction supported";
  }
  if (extension === ".pptx") {
    return "Partial PPTX slide text extraction supported";
  }
  if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    return "OCR supported. Accuracy depends on image clarity.";
  }
  return "Metadata-only for now";
}

async function extractTextFromPptx(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const textParts: string[] = [];
  for (const slidePath of slidePaths) {
    const xml = await zip.files[slidePath].async("string");
    const slideText = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => decodeXml(match[1]))
      .join(" ");
    if (slideText.trim()) {
      textParts.push(`Slide ${textParts.length + 1}: ${slideText}`);
    }
  }

  return textParts.join("\n\n");
}

async function extractTextWithOcr(filePath: string) {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(filePath);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
