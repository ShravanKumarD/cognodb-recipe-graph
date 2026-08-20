"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import { categoryIcon, ALLERGEN_ICONS } from "@/lib/icons";
import type { RecipeIngredientLine, Substitute } from "@/lib/types";

const ALL_ALLERGENS = Object.keys(ALLERGEN_ICONS);

type RowState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; substitutes: Substitute[] };

export default function SubstitutionExplorer({
  ingredients,
}: {
  ingredients: RecipeIngredientLine[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hops, setHops] = useState(2);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  async function loadSubstitutes(ingredientId: string) {
    setRows((prev) => ({ ...prev, [ingredientId]: { status: "loading" } }));
    try {
      const params = new URLSearchParams({ hops: String(hops) });
      if (avoid.length > 0) params.set("avoid", avoid.join(","));
      const res = await fetch(`/api/substitutes/${ingredientId}?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load substitutes.");
      }
      const body = await res.json();
      setRows((prev) => ({
        ...prev,
        [ingredientId]: { status: "ready", substitutes: body.substitutes },
      }));
    } catch (err) {
      setRows((prev) => ({
        ...prev,
        [ingredientId]: {
          status: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        },
      }));
    }
  }

  function toggleExpand(ingredientId: string) {
    const next = expanded === ingredientId ? null : ingredientId;
    setExpanded(next);
    if (next && !rows[next]) {
      loadSubstitutes(next);
    }
  }

  function toggleAllergen(name: string) {
    setAvoid((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));
    setRows({});
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">Chain depth</span>
          <input
            type="range"
            min={1}
            max={4}
            value={hops}
            onChange={(e) => {
              setHops(Number(e.target.value));
              setRows({});
            }}
            className="accent-accent"
          />
          <span className="w-4 text-center font-medium">{hops}</span>
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-muted">Avoid:</span>
          {ALL_ALLERGENS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAllergen(a)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                avoid.includes(a)
                  ? "border-warn/40 bg-warn/10 text-warn"
                  : "border-border text-muted hover:border-warn/30"
              }`}
            >
              {ALLERGEN_ICONS[a]} {a}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {ingredients.map((ing) => {
          const isOpen = expanded === ing.id;
          const state = rows[ing.id];

          return (
            <li key={ing.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{categoryIcon(ing.category)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium capitalize">{ing.name}</span>
                    {ing.optional && <Badge>optional</Badge>}
                    {ing.allergens.map((a) => (
                      <Badge key={a} variant="warn">
                        {ALLERGEN_ICONS[a] ?? ""} {a}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted">
                    {ing.quantity} {ing.unit}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpand(ing.id)}
                  className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {isOpen ? "Hide substitutes" : "Substitutes"}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border bg-bg/60 px-4 py-3">
                  {state?.status === "loading" && (
                    <p className="text-sm text-muted">Tracing substitution chains…</p>
                  )}
                  {state?.status === "error" && (
                    <p className="text-sm text-warn">{state.message}</p>
                  )}
                  {state?.status === "ready" && state.substitutes.length === 0 && (
                    <p className="text-sm text-muted">
                      No substitutes found within {hops} hop{hops > 1 ? "s" : ""}
                      {avoid.length > 0 ? " that avoid the selected allergens." : "."}
                    </p>
                  )}
                  {state?.status === "ready" && state.substitutes.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {state.substitutes.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{sub.path.join(" → ")}</span>
                            <Badge variant="accent">
                              {sub.hops} hop{sub.hops > 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted">
                            {sub.ratio && <span className="font-medium text-fg">{sub.ratio} · </span>}
                            {sub.context}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
