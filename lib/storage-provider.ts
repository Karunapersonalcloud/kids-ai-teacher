import { promises as fs } from "fs";
import path from "path";

export type StorageProvider = {
  root: string;
  ensureDir(relativePath?: string): Promise<void>;
  writeFile(relativePath: string, data: Buffer | Uint8Array | string): Promise<string>;
  readFile(relativePath: string): Promise<Buffer>;
  toAbsolutePath(relativePath: string): string;
};

class LocalFileStorageProvider implements StorageProvider {
  root = path.join(process.cwd(), "storage");

  async ensureDir(relativePath = "") {
    await fs.mkdir(path.join(this.root, relativePath), { recursive: true });
  }

  async writeFile(relativePath: string, data: Buffer | Uint8Array | string) {
    const absolutePath = this.toAbsolutePath(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, data);
    return absolutePath;
  }

  async readFile(relativePath: string) {
    return fs.readFile(this.toAbsolutePath(relativePath));
  }

  toAbsolutePath(relativePath: string) {
    return path.join(this.root, relativePath);
  }
}

export const storageProvider: StorageProvider = new LocalFileStorageProvider();

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}
