import { notFound } from "next/navigation";
import Link from "next/link";
import { getIngredientById } from "@/lib/queries";
import { categoryIcon, cuisineIcon, ALLERGEN_ICONS } from "@/lib/icons";
import Badge from "@/components/Badge";
import PathFinder from "@/components/PathFinder";
import EmptyState from "@/components/EmptyState";

export default async function IngredientDetailPage({
  params,
}: PageProps<"/ingredients/[id]">) {
  const { id } = await params;
  const ingredient = await getIngredientById(id);

  if (!ingredient) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/ingredients" className="text-sm text-muted hover:text-accent">
        ← All ingredients
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl">{categoryIcon(ingredient.category)}</span>
        <div>
          <h1 className="font-display text-3xl font-semibold capitalize">{ingredient.name}</h1>
          <p className="text-sm text-muted capitalize">{ingredient.category.replace("-", " ")}</p>
        </div>
      </div>

      {ingredient.allergens.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ingredient.allergens.map((a) => (
            <Badge key={a} variant="warn">
              {ALLERGEN_ICONS[a] ?? ""} {a}
            </Badge>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Direct substitutes</h2>
        {ingredient.directSubstitutes.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No direct substitution on file — try the path finder below for a longer chain.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {ingredient.directSubstitutes.map((sub) => (
              <li
                key={sub.id}
                className="rounded-xl border border-border bg-surface px-4 py-3"
              >
                <Link
                  href={`/ingredients/${sub.id}`}
                  className="font-medium capitalize hover:text-accent"
                >
                  {sub.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-medium text-fg">{sub.ratio}</span> · {sub.context}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Path to another ingredient</h2>
        <p className="mt-1 mb-3 text-sm text-muted">
          Not every substitution is direct — the graph can trace a chain through several steps.
        </p>
        <PathFinder fromId={ingredient.id} fromName={ingredient.name} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Pairs well with</h2>
        {ingredient.pairsWith.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Not enough shared recipes yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {ingredient.pairsWith.map((p) => (
              <Link
                key={p.id}
                href={`/ingredients/${p.id}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent/40"
              >
                <span className="capitalize">{p.name}</span>{" "}
                <span className="text-xs text-muted">
                  · {p.sharedRecipes} {p.sharedRecipes === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Used in</h2>
        {ingredient.usedInRecipes.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon="🍽️" title="Not used in any recipe yet" />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {ingredient.usedInRecipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipes/${r.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40"
                >
                  <span>
                    <span className="mr-2">{cuisineIcon(r.cuisine)}</span>
                    <span className="font-medium">{r.name}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {r.quantity} {r.unit}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
