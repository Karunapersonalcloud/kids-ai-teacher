import { scanLocalTextbookFolders } from "@/lib/local-textbook-scanner";
import { getRequestAccess } from "@/lib/request-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await getRequestAccess(request);
  if (access.userType !== "internalFamily") {
    return Response.json({ error: "Local textbook folders are internal family resources." }, { status: 403 });
  }
  return Response.json(await scanLocalTextbookFolders());
}
