import { NextRequest } from "next/server";
import { proxyToSeed } from "../_proxy";
export async function POST(request: NextRequest) { return proxyToSeed(request, "run", "POST"); }
