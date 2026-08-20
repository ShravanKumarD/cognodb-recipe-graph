import { NextRequest, NextResponse } from "next/server";
import { findSubstitutionPath } from "@/lib/queries";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' ingredient ids are required." },
      { status: 400 }
    );
  }

  try {
    const result = await findSubstitutionPath(from, to);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
