# Kids AI Teacher / ConceptKid

ConceptKid is a kid-friendly AI learning MVP built with Next.js, Tailwind CSS, Prisma, and PostgreSQL-ready persistence. It is designed as a controlled AI private teacher for children, with public demo access, parent/admin approval, AI learning tools, textbook ingestion, and progress tracking.

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
- PostgreSQL/Prisma persistence with local JSON fallback

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

## Prisma / PostgreSQL

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations against a configured PostgreSQL database:

```bash
npm run prisma:deploy
```

Seed the internal family admin and children:

```bash
npm run db:seed
```

## Environment Variables

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=15KLTJUjUCNrcNrYUVGRw94Q2ZmnyPXIF
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
ADMIN_EMAIL=
ADMIN_PIN=
ADMIN_NAME=
```

Never commit `.env.local` or real API keys.

## Storage Warning

The app can run in JSON fallback mode or PostgreSQL mode.

JSON mode uses local files under `storage/`. This is for local development only.

PostgreSQL mode stores critical access, usage, progress, upload metadata, quiz results, and indexed chunks through Prisma. Set:

```env
PERSISTENCE_PROVIDER=postgres
DATABASE_URL=
```

For Vercel production, confirm these values are set:

```env
DATABASE_URL=
PERSISTENCE_PROVIDER=postgres
OPENAI_MODEL=gpt-4o-mini
SESSION_SECRET=
GOOGLE_DRIVE_FOLDER_ID=15KLTJUjUCNrcNrYUVGRw94Q2ZmnyPXIF
ADMIN_EMAIL=
ADMIN_PIN=
ADMIN_NAME=ConceptKid Admin
```

`OPENAI_API_KEY` and `GOOGLE_DRIVE_API_KEY` are optional until those integrations are enabled for production traffic.

For production, use durable services:

- PostgreSQL for users, access requests, progress, and metadata
- Cloud storage for uploaded files and indexed materials
- A production auth provider or hardened credential system
- A queue/background worker for large file parsing and indexing

## Deployment Plan

The live domain is `https://conceptkid.in`, with Vercel deployment planned/active.

Before inviting real users, enable PostgreSQL mode and use cloud storage for original uploaded files. Local filesystem persistence is not suitable for serverless hosting.

See [docs/production-vercel-neon.md](docs/production-vercel-neon.md) for the Neon + Vercel setup.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
```
