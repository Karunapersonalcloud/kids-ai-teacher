# Production Persistence: Vercel + Neon + Prisma

Kids AI Teacher currently supports two persistence modes:

- `json`: local development fallback using files under `storage/`
- `postgres`: production metadata/progress/access/usage/index chunks using PostgreSQL through Prisma

JSON mode is not for production. Vercel serverless filesystem data is not persistent across deployments or instances, so real users need PostgreSQL plus durable file storage.

## 1. Create Neon PostgreSQL

1. Create a Neon account and project.
2. Create a database for ConceptKid / Kids AI Teacher.
3. Copy the pooled PostgreSQL connection string.
4. Keep the connection string private. Never commit it.

## 2. Add Vercel Environment Variables

Add these in Vercel Project Settings:

```env
DATABASE_URL=
PERSISTENCE_PROVIDER=postgres
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=15KLTJUjUCNrcNrYUVGRw94Q2ZmnyPXIF
GOOGLE_DRIVE_API_KEY=
SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_PIN=
ADMIN_NAME=ConceptKid Admin
EMAIL_PROVIDER=
RESEND_API_KEY=
EMAIL_FROM=ConceptKid Support <support@conceptkid.in>
APP_BASE_URL=https://conceptkid.in
```

Optional/local-only variables:

```env
LOCAL_TEXTBOOK_ROOT=
NCERT_DOWNLOAD_ROOT=
NCERT_AUTO_CHECK_ENABLED=false
APP_AUTH_MODE=local
```

## 3. Run Migration Locally

Add the same `DATABASE_URL` to `.env.local` only on your machine, then run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

`ADMIN_PIN` is a temporary admin PIN. The seeded admin is forced to change it on first login.

For local development against a fresh Neon branch, you can also use:

```bash
npx prisma migrate dev --name init
```

This repository includes the initial migration under `prisma/migrations/`.

## 4. Deploy on Vercel

Recommended Vercel build command:

```bash
npx prisma migrate deploy && npm run build
```

The app also has `postinstall: prisma generate`, so Prisma Client is generated during install.

## 5. Smoke Test

1. Open `https://conceptkid.in/register`.
2. Submit a test registration.
3. Open `/admin` as Family Admin.
4. Approve the test user.
5. Confirm the temporary PIN appears and, while email sending is not configured, the admin panel asks you to use Copy Login Instructions.
6. Login at `/login`.
7. Confirm first login redirects to `/change-credentials`.
8. Confirm AI usage/progress updates are saved.

If email is not configured, approval still works. The admin panel will show that email was not sent and you can use **Copy Login Instructions** as the fallback. The prepared support sender is `ConceptKid Support <support@conceptkid.in>`. Add a real provider later after domain verification.

## 6. Remaining Production Work

- Move original uploaded files to durable object storage such as Vercel Blob, S3, Cloudflare R2, or Google Cloud Storage.
- Keep download restrictions enforced for external users.
- Replace MVP PIN storage with a proper password hash and reset flow.
- Add production authentication before inviting broader public users.
- Consider pgvector later for semantic textbook retrieval.

## Switching Modes

Local JSON fallback:

```env
PERSISTENCE_PROVIDER=json
DATABASE_URL=
```

PostgreSQL production mode:

```env
PERSISTENCE_PROVIDER=postgres
DATABASE_URL=postgresql://...
```
