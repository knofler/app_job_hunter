import { NextRequest } from "next/server";
import { proxyProjects } from "../../../_proxy";
type P = { params: Promise<{ projectId: string; runId: string }> };
export async function GET(_req: NextRequest, { params }: P) {
  const { projectId, runId } = await params;
  return proxyProjects(_req, `/${projectId}/runs/${runId}`);
}
