import { getNcertBooksWithStatus } from "@/lib/ncert-downloader";
import { getRequestAccess } from "@/lib/request-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await getRequestAccess(request);
  return Response.json({
    books: await getNcertBooksWithStatus(),
    canImportFromDrive: access.policy.canImportFromDrive,
    canDownloadMaterials: access.policy.canDownloadMaterials,
    autoCheckEnabled: process.env.NCERT_AUTO_CHECK_ENABLED === "true",
    notice: "NCERT downloads are manual. The app checks/downloads only when you click.",
  });
}
