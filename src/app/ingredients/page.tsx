import Link from "next/link";
import { listIngredients } from "@/lib/queries";
import { categoryIcon, ALLERGEN_ICONS } from "@/lib/icons";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";

export const metadata = { title: "Ingredients — Substitute" };

export default async function IngredientsPage({
  searchParams,
}: PageProps<"/ingredients">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const ingredients = await listIngredients(q);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Ingredients</h1>
      <p className="mt-1 text-muted">
        {ingredients.length} ingredients in the graph. Open one to see what it substitutes for,
        what it pairs with, and trace a path to any other ingredient.
      </p>

      <form className="mt-6" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search ingredients..."
          className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
        />
      </form>

      {ingredients.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="🫙" title="No ingredients match that search" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ing) => (
            <Link
              key={ing.id}
              href={`/ingredients/${ing.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
            >
              <span className="text-xl">{categoryIcon(ing.category)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium capitalize">{ing.name}</p>
                <p className="text-xs text-muted capitalize">{ing.category.replace("-", " ")}</p>
              </div>
              {ing.allergens.length > 0 && (
                <div className="flex gap-1">
                  {ing.allergens.slice(0, 2).map((a) => (
                    <Badge key={a} variant="warn">
                      {ALLERGEN_ICONS[a] ?? ""}
                    </Badge>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
