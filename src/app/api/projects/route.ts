import { NextRequest } from "next/server";
import { proxyProjects } from "./_proxy";
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search;
  return proxyProjects(req, `${search}`);
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyProjects(req, "", "POST", body);
}
