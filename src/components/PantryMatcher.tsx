"use client";

import { useState } from "react";
import Link from "next/link";
import IngredientAutocomplete from "@/components/IngredientAutocomplete";
import EmptyState from "@/components/EmptyState";
import DbErrorNotice from "@/components/DbErrorNotice";
import { categoryIcon, cuisineIcon } from "@/lib/icons";
import type { IngredientListItem, PantryMatch } from "@/lib/queries";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matches: PantryMatch[] };

export default function PantryMatcher() {
  const [have, setHave] = useState<IngredientListItem[]>([]);
  const [state, setState] = useState<State>({ status: "idle" });

  async function search(nextHave: IngredientListItem[]) {
    if (nextHave.length === 0) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haveIds: nextHave.map((i) => i.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not match recipes.");
      }
      const body = await res.json();
      setState({ status: "ready", matches: body.matches });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function addIngredient(ingredient: IngredientListItem) {
    const next = [...have, ingredient];
    setHave(next);
    search(next);
  }

  function removeIngredient(id: string) {
    const next = have.filter((i) => i.id !== id);
    setHave(next);
    search(next);
  }

  return (
    <div>
      <IngredientAutocomplete
        placeholder="Add an ingredient you have..."
        excludeIds={have.map((i) => i.id)}
        onSelect={addIngredient}
      />

      {have.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {have.map((i) => (
            <button
              key={i.id}
              onClick={() => removeIngredient(i.id)}
              className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm text-accent"
            >
              <span>{categoryIcon(i.category)}</span>
              <span className="capitalize">{i.name}</span>
              <span className="text-xs">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {state.status === "idle" && (
          <EmptyState
            icon="🧺"
            title="Add a few ingredients to get started"
            description="We'll rank every recipe by how much of it you can already make — counting a substitution as covered too."
          />
        )}

        {state.status === "loading" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        )}

        {state.status === "error" && <DbErrorNotice message={state.message} />}

        {state.status === "ready" && state.matches.length === 0 && (
          <EmptyState
            icon="🤔"
            title="No recipe matches yet"
            description="Try adding a staple like garlic, onion or rice — most recipes lean on a few of these."
          />
        )}

        {state.status === "ready" && state.matches.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {state.matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/recipes/${m.id}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-muted">
                        {cuisineIcon(m.cuisine)} {m.cuisine}
                      </span>
                      <p className="font-display font-semibold">{m.name}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">
                      {Math.round(m.coverage * 100)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(m.coverage * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-muted">
                    {m.coveredCount} of {m.totalRequired} required ingredients covered
                    {m.substitutedIngredients.length > 0 &&
                      ` (${m.substitutedIngredients.length} via a substitute)`}
                  </p>

                  {m.missingIngredients.length > 0 && (
                    <p className="text-xs text-muted">
                      Missing: {m.missingIngredients.slice(0, 4).join(", ")}
                      {m.missingIngredients.length > 4 && "…"}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
