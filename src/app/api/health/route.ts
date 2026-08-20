import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";

export async function GET() {
  const result = await pingDatabase();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
