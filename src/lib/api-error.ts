import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "@/lib/db";

export function handleApiError(err: unknown) {
  if (err instanceof DatabaseUnavailableError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  console.error(err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
