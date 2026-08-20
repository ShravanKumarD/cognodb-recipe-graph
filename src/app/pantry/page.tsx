import PantryMatcher from "@/components/PantryMatcher";

export const metadata = { title: "Pantry match — Substitute" };

export default function PantryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">What can I cook tonight?</h1>
      <p className="mt-1 text-muted">
        Add what&apos;s in your kitchen. A recipe counts an ingredient as covered if you have it
        directly, or if you have something one substitution hop away.
      </p>

      <div className="mt-8">
        <PantryMatcher />
      </div>
    </div>
  );
}
