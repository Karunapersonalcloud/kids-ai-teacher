import { checkNcertBook } from "@/lib/ncert-downloader";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { bookId?: string };
  if (!body.bookId) {
    return Response.json({ error: "bookId is required." }, { status: 400 });
  }

  try {
    return Response.json(await checkNcertBook(body.bookId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "NCERT check failed." }, { status: 400 });
  }
}
