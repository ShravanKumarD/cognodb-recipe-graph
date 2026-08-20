import Link from "next/link";
import Badge from "@/components/Badge";
import { cuisineIcon } from "@/lib/icons";
import type { RecipeSummary } from "@/lib/queries";

export default function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-muted">
            {cuisineIcon(recipe.cuisine)} {recipe.cuisine}
          </span>
          <h3 className="font-display text-lg leading-snug font-semibold group-hover:text-accent">
            {recipe.name}
          </h3>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted">{recipe.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted">
        <span>⏱ {totalMinutes} min</span>
        <span>🍽 {recipe.servings} servings</span>
        <span className="capitalize">{recipe.difficulty}</span>
        <span>{recipe.ingredientCount} ingredients</span>
      </div>

      {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.dietaryTags.map((tag) => (
            <Badge key={tag} variant="good">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
