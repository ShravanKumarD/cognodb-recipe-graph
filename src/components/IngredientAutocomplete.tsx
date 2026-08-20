"use client";

import { useEffect, useRef, useState } from "react";
import { categoryIcon } from "@/lib/icons";
import type { IngredientListItem } from "@/lib/queries";

export default function IngredientAutocomplete({
  placeholder = "Search ingredients...",
  excludeIds = [],
  onSelect,
}: {
  placeholder?: string;
  excludeIds?: string[];
  onSelect: (ingredient: IngredientListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IngredientListItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = await res.json();
        setResults(body.ingredients ?? []);
      } catch {
        // request superseded or aborted, ignore
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered =
    query.trim().length === 0 ? [] : results.filter((r) => !excludeIds.includes(r.id));

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {filtered.map((ing) => (
            <li key={ing.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(ing);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent-soft/40"
              >
                <span>{categoryIcon(ing.category)}</span>
                <span className="capitalize">{ing.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
