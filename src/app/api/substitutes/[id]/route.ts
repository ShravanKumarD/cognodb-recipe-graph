import { NextRequest, NextResponse } from "next/server";
import { getSubstitutes } from "@/lib/queries";
import { handleApiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/substitutes/[id]">
) {
  const { id } = await context.params;
  const hopsParam = request.nextUrl.searchParams.get("hops");
  const avoidParam = request.nextUrl.searchParams.get("avoid");

  const maxHops = hopsParam ? Number.parseInt(hopsParam, 10) : 3;
  const avoidAllergens = avoidParam ? avoidParam.split(",").filter(Boolean) : [];

  try {
    const substitutes = await getSubstitutes(id, { maxHops, avoidAllergens });
    return NextResponse.json({ substitutes });
  } catch (err) {
    return handleApiError(err);
  }
}
