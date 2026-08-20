"use client";

import { useEffect } from "react";
import DbErrorNotice from "@/components/DbErrorNotice";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <DbErrorNotice message={error.message} />
      <button
        onClick={reset}
        className="mx-auto mt-6 block rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
