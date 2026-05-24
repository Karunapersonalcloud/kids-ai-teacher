# Kids AI Teacher Deployment Notes

## Current Mode

The app currently runs in local development mode.

- Files are saved under `storage/uploads/`.
- Upload metadata is saved to `storage/uploads/metadata.json`.
- Text chunks are saved to `storage/indexes/chunks.json`.
- Progress is saved to `storage/progress.json`.
- Google Drive API keys are used only on server routes.
- OpenAI API keys are used only on server routes.

This is good for development and family testing on one machine.

## Why Local Files Are Not Enough For Hosted Serverless Apps

Platforms like Vercel can run serverless functions where the filesystem is temporary. Uploaded files and JSON files can disappear between deployments or function restarts. For production, use durable services.

## Recommended Production Architecture

- App hosting: Vercel, Azure App Service, Render, or a small VPS.
- File storage: Google Cloud Storage, AWS S3, Azure Blob Storage, or Supabase Storage.
- Database: PostgreSQL with Prisma or Drizzle.
- Auth: Clerk, Auth.js, Supabase Auth, or Firebase Auth.
- Background jobs: a queue for indexing large PDFs, OCR, and Drive imports.
- Search/RAG: start with PostgreSQL full-text search, then add embeddings with a vector database when needed.

## Storage Provider Plan

`lib/storage-provider.ts` wraps local filesystem storage. Future production storage can implement the same shape:

- `writeFile`
- `readFile`
- `toAbsolutePath`
- `ensureDir`

The rest of the app should call the provider or existing upload helpers rather than hardcoding Windows paths.

## Environment Variables

Create `.env.local` in development:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=
LOCAL_TEXTBOOK_ROOT=I:\Eductions
NCERT_AUTO_CHECK_ENABLED=false
```

## NCERT Downloader

The `/ncert` page can manually check and download configured NCERT books from official NCERT/ePathshala sources only. Configuration lives in `lib/ncert-required-books.ts`. See `docs/ncert-downloader.md` for setup and limitations.

## Google Drive Setup

1. Create or use a Google Cloud project.
2. Enable Google Drive API.
3. Create an API key.
4. Share the `Kids_AI_Teacher` Drive folder publicly or with link access.
5. Put the folder ID into `GOOGLE_DRIVE_FOLDER_ID`.

Google-native Docs/Slides may not download as blobs through the simple file download endpoint. Export them as PDF, DOCX, TXT, or PPTX first.

## OCR Notes

Image OCR uses local OCR in development. It works best with:

- clear photos
- straight pages
- high contrast
- printed text

Handwritten diary/homework OCR can be imperfect. The app should show the extracted text to parents before relying on it heavily.

## Auth Plan

`lib/auth-types.ts` defines parent/student roles and access helpers. Full production auth is intentionally not wired yet.

Recommended next step:

1. Add an auth provider.
2. Store users and child access in a database.
3. Protect `/parent` and `/parent/ai-review`.
4. Add student viewing mode for each child.
