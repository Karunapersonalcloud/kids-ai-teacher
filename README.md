# Kids AI Teacher / ConceptKid

ConceptKid is a kid-friendly AI learning MVP built with Next.js, Tailwind CSS, and local development storage. It is designed as a controlled AI private teacher for children, with public demo access, parent/admin approval, AI learning tools, textbook ingestion, and progress tracking.

## Current Features

- Public landing page and demo mode
- Registration with admin approval
- Temporary PIN first-login flow
- AI Teacher for child-friendly doubt solving
- Visual lesson generator
- Uploads, parsing, OCR scaffolding, and indexing
- NCERT and local textbook support
- Quiz generation and progress tracking
- Parent dashboard and AI review
- Local JSON-based access, usage, upload, and progress stores

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and fill only the values you need for local development.

```bash
copy .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Environment Variables

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=
LOCAL_TEXTBOOK_ROOT=
NCERT_DOWNLOAD_ROOT=
NCERT_AUTO_CHECK_ENABLED=false
APP_AUTH_MODE=local
PARENT_PIN=
JAYADEEP_PIN=
HARINI_PIN=
SESSION_SECRET=
DATABASE_URL=
PERSISTENCE_PROVIDER=json
```

Never commit `.env.local` or real API keys.

## Storage Warning

The current MVP uses local JSON files and local filesystem storage under `storage/`. This is for local development only.

For production, use durable services:

- PostgreSQL for users, access requests, progress, and metadata
- Cloud storage for uploaded files and indexed materials
- A production auth provider or hardened credential system
- A queue/background worker for large file parsing and indexing

## Deployment Plan

The domain `conceptkid.in` has been purchased. Vercel deployment is planned.

Before production deployment, replace local JSON/storage mode with PostgreSQL and cloud storage. Local filesystem persistence is not suitable for serverless hosting.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
```
