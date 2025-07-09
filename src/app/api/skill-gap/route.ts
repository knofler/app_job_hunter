import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Mock skill gap analysis
  return NextResponse.json({
    required: ["React", "TypeScript", "Leadership"],
    present: ["React"],
    missing: ["TypeScript", "Leadership"],
  });
}
