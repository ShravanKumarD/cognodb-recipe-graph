import { NextRequest, NextResponse } from "next/server";
import { listIngredients } from "@/lib/queries";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") ?? "";

  try {
    const ingredients = await listIngredients(search);
    return NextResponse.json({ ingredients });
  } catch (err) {
    return handleApiError(err);
  }
}
