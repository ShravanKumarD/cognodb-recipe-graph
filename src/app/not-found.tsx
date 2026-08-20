import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <EmptyState
        icon="🤷"
        title="Nothing here"
        description="That page, recipe or ingredient doesn't exist in the graph."
        action={
          <Link
            href="/"
            className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg"
          >
            Back home
          </Link>
        }
      />
    </div>
  );
}
