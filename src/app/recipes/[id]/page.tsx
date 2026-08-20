import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById } from "@/lib/queries";
import Badge from "@/components/Badge";
import SubstitutionExplorer from "@/components/SubstitutionExplorer";
import { cuisineIcon, ALLERGEN_ICONS } from "@/lib/icons";

export default async function RecipeDetailPage({
  params,
}: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) notFound();

  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/recipes" className="text-sm text-muted hover:text-accent">
        ← All recipes
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          {recipe.cuisine && (
            <p className="text-sm font-medium text-muted">
              {cuisineIcon(recipe.cuisine)} {recipe.cuisine}
            </p>
          )}
          <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">{recipe.name}</h1>
        </div>
      </div>

      <p className="mt-3 text-lg text-muted">{recipe.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {recipe.dietaryTags?.map((tag) => (
          <Badge key={tag} variant="good">
            {tag}
          </Badge>
        ))}
        {recipe.allergens.map((a) => (
          <Badge key={a} variant="warn">
            {ALLERGEN_ICONS[a] ?? ""} contains {a}
          </Badge>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Prep" value={`${recipe.prepMinutes} min`} />
        <Stat label="Cook" value={`${recipe.cookMinutes} min`} />
        <Stat label="Total" value={`${totalMinutes} min`} />
        <Stat label="Serves" value={String(recipe.servings)} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Ingredients</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Missing something? Open a row to trace a substitution chain through the graph.
        </p>
        <SubstitutionExplorer ingredients={recipe.ingredients} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Instructions</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
