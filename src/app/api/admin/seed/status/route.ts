import { NextRequest } from "next/server";
import { proxyToSeed } from "../_proxy";
export async function GET(request: NextRequest) { return proxyToSeed(request, "status", "GET"); }
