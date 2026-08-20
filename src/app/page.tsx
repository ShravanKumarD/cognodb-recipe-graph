import Link from "next/link";
import { getGraphStats, listCuisines } from "@/lib/queries";
import { cuisineIcon } from "@/lib/icons";
import DbErrorNotice from "@/components/DbErrorNotice";

export const dynamic = "force-dynamic";

async function StatsAndCuisines() {
  let stats;
  let cuisines;

  try {
    [stats, cuisines] = await Promise.all([getGraphStats(), listCuisines()]);
  } catch (err) {
    return <DbErrorNotice message={err instanceof Error ? err.message : undefined} />;
  }

  return (
    <>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Recipes", stats.recipeCount],
          ["Ingredients", stats.ingredientCount],
          ["Substitution links", stats.substitutionCount],
          ["Cuisines", stats.cuisineCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5 text-center">
            <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
            <dd className="font-display text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Browse by cuisine</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cuisines.map((c) => (
            <Link
              key={c.name}
              href={`/recipes?cuisine=${encodeURIComponent(c.name)}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
            >
              <span className="text-xl">{cuisineIcon(c.name)}</span>
              <span className="flex-1 text-sm font-medium">{c.name}</span>
              <span className="text-xs text-muted">{c.recipeCount}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <section className="flex flex-col items-start gap-5">
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          Recipes, ingredients and substitutions, modeled as a graph
        </span>
        <h1 className="font-display max-w-2xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Cook with what connects.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Substitute treats every recipe as a set of relationships, not a set of rows. Chain
          substitutions across ingredients, match recipes to what&apos;s already in your pantry,
          and see how one swap ripples into a fully allergy-safe dish.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/recipes"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Browse recipes
          </Link>
          <Link
            href="/pantry"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent/40"
          >
            What can I cook tonight?
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <StatsAndCuisines />
      </section>

      <section className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureCard
          icon="🔀"
          title="Substitution chains"
          body="Out of butter? Follow multi-hop substitution paths to a dairy-free, vegan-safe swap on any recipe page."
        />
        <FeatureCard
          icon="🧺"
          title="Pantry match"
          body="Tell us what you already have and we'll rank recipes by coverage, counting ingredients reachable through a substitution too."
        />
        <FeatureCard
          icon="🧭"
          title="Ingredient paths"
          body="Ask how two ingredients connect and watch the graph trace the shortest chain between them."
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
