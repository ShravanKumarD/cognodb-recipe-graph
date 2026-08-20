import { NextRequest, NextResponse } from "next/server";
import { matchRecipesToPantry } from "@/lib/queries";
import { handleApiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const haveIds = body?.haveIds;

  if (!Array.isArray(haveIds) || haveIds.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "Body must be { haveIds: string[] }." },
      { status: 400 }
    );
  }

  if (haveIds.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  try {
    const matches = await matchRecipesToPantry(haveIds);
    return NextResponse.json({ matches });
  } catch (err) {
    return handleApiError(err);
  }
}
