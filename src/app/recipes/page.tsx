import { searchRecipes, listCuisines, listDietaryTags } from "@/lib/queries";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Recipes — Substitute" };

export default async function RecipesPage({
  searchParams,
}: PageProps<"/recipes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const tag = typeof params.tag === "string" ? params.tag : "";

  const [recipes, cuisines, tags] = await Promise.all([
    searchRecipes({ query: q, cuisine, dietaryTag: tag }),
    listCuisines(),
    listDietaryTags(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Recipes</h1>
      <p className="mt-1 text-muted">
        Search, filter by cuisine or diet — every filter runs as a parameterized Cypher query.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search recipes..."
          className="min-w-[220px] flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          name="cuisine"
          defaultValue={cuisine}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.recipeCount})
            </option>
          ))}
        </select>
        <select
          name="tag"
          defaultValue={tag}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">Any diet</option>
          {tags.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name} ({t.recipeCount})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          Filter
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
      </p>

      {recipes.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="🍳"
            title="No recipes match those filters"
            description="Try clearing the search or picking a different cuisine."
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
