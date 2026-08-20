"use client";

import { useState } from "react";
import IngredientAutocomplete from "@/components/IngredientAutocomplete";
import Badge from "@/components/Badge";
import type { IngredientListItem } from "@/lib/queries";
import type { SubstitutionPathResult } from "@/lib/queries";

export default function PathFinder({
  fromId,
  fromName,
}: {
  fromId: string;
  fromName: string;
}) {
  const [target, setTarget] = useState<IngredientListItem | null>(null);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; result: SubstitutionPathResult }
  >({ status: "idle" });

  async function findPath(ingredient: IngredientListItem) {
    setTarget(ingredient);
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/path?from=${fromId}&to=${ingredient.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not search for a path.");
      }
      const result: SubstitutionPathResult = await res.json();
      setState({ status: "ready", result });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-sm text-muted">
        How does <span className="font-medium text-fg capitalize">{fromName}</span> connect to
        another ingredient?
      </p>
      <IngredientAutocomplete
        placeholder="Pick an ingredient to compare..."
        excludeIds={[fromId]}
        onSelect={findPath}
      />

      {state.status === "loading" && (
        <p className="mt-3 text-sm text-muted">Searching the graph…</p>
      )}
      {state.status === "error" && <p className="mt-3 text-sm text-warn">{state.message}</p>}
      {state.status === "ready" && !state.result.found && target && (
        <p className="mt-3 text-sm text-muted">
          No substitution path found between {fromName} and {target.name} yet.
        </p>
      )}
      {state.status === "ready" && state.result.found && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {state.result.path.map((p) => p.name).join(" → ")}
            </span>
            <Badge variant="accent">
              {state.result.hops} hop{state.result.hops > 1 ? "s" : ""}
            </Badge>
          </div>
          <ul className="flex flex-col gap-1">
            {state.result.steps.map((step, i) => (
              <li key={i} className="text-xs text-muted">
                {step.ratio && <span className="font-medium text-fg">{step.ratio} · </span>}
                {step.context}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
