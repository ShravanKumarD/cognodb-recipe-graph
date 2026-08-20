import neo4j from "neo4j-driver";
import { runQuery } from "@/lib/db";
import type {
  Recipe,
  RecipeIngredientLine,
  Substitute,
  IngredientCategory,
} from "@/lib/types";

function num(value: unknown): number {
  if (neo4j.isInt(value)) return value.toNumber();
  return value as number;
}

export interface GraphStats {
  recipeCount: number;
  ingredientCount: number;
  substitutionCount: number;
  cuisineCount: number;
}

export async function getGraphStats(): Promise<GraphStats> {
  const rows = await runQuery<{
    recipeCount: unknown;
    ingredientCount: unknown;
    substitutionCount: unknown;
    cuisineCount: unknown;
  }>(
    `MATCH (r:Recipe)
     WITH count(r) AS recipeCount
     MATCH (i:Ingredient)
     WITH recipeCount, count(i) AS ingredientCount
     MATCH ()-[s:SUBSTITUTE_FOR]->()
     WITH recipeCount, ingredientCount, count(s) AS substitutionCount
     MATCH (c:Cuisine)
     RETURN recipeCount, ingredientCount, substitutionCount, count(c) AS cuisineCount`
  );

  const row = rows[0];
  return {
    recipeCount: num(row.recipeCount),
    ingredientCount: num(row.ingredientCount),
    substitutionCount: num(row.substitutionCount),
    cuisineCount: num(row.cuisineCount),
  };
}

export async function listCuisines(): Promise<{ name: string; recipeCount: number }[]> {
  const rows = await runQuery<{ name: string; recipeCount: unknown }>(
    `MATCH (c:Cuisine)
     OPTIONAL MATCH (c)<-[:BELONGS_TO]-(r:Recipe)
     RETURN c.name AS name, count(r) AS recipeCount
     ORDER BY c.name`
  );
  return rows.map((r) => ({ name: r.name, recipeCount: num(r.recipeCount) }));
}

export async function listDietaryTags(): Promise<{ name: string; recipeCount: number }[]> {
  const rows = await runQuery<{ name: string; recipeCount: unknown }>(
    `MATCH (t:DietaryTag)
     OPTIONAL MATCH (t)<-[:TAGGED]-(r:Recipe)
     RETURN t.name AS name, count(r) AS recipeCount
     ORDER BY t.name`
  );
  return rows.map((r) => ({ name: r.name, recipeCount: num(r.recipeCount) }));
}

export interface RecipeSummary extends Recipe {
  ingredientCount: number;
}

export async function searchRecipes(filters: {
  query?: string;
  cuisine?: string;
  dietaryTag?: string;
  maxTotalMinutes?: number;
}): Promise<RecipeSummary[]> {
  const rows = await runQuery<{
    id: string;
    name: string;
    description: string;
    prepMinutes: unknown;
    cookMinutes: unknown;
    servings: unknown;
    difficulty: Recipe["difficulty"];
    cuisine: string;
    dietaryTags: string[];
    ingredientCount: unknown;
  }>(
    `MATCH (r:Recipe)-[:BELONGS_TO]->(c:Cuisine)
     OPTIONAL MATCH (r)-[:TAGGED]->(t:DietaryTag)
     OPTIONAL MATCH (r)-[:USES]->(i:Ingredient)
     WITH r, c, collect(DISTINCT t.name) AS dietaryTags, count(DISTINCT i) AS ingredientCount
     WHERE ($query = "" OR toLower(r.name) CONTAINS toLower($query) OR toLower(r.description) CONTAINS toLower($query))
       AND ($cuisine = "" OR c.name = $cuisine)
       AND ($dietaryTag = "" OR $dietaryTag IN dietaryTags)
       AND ($maxTotalMinutes = 0 OR (r.prepMinutes + r.cookMinutes) <= $maxTotalMinutes)
     RETURN r.id AS id, r.name AS name, r.description AS description,
            r.prepMinutes AS prepMinutes, r.cookMinutes AS cookMinutes,
            r.servings AS servings, r.difficulty AS difficulty,
            c.name AS cuisine, dietaryTags, ingredientCount
     ORDER BY r.name`,
    {
      query: filters.query ?? "",
      cuisine: filters.cuisine ?? "",
      dietaryTag: filters.dietaryTag ?? "",
      maxTotalMinutes: filters.maxTotalMinutes ?? 0,
    }
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    prepMinutes: num(r.prepMinutes),
    cookMinutes: num(r.cookMinutes),
    servings: num(r.servings),
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    dietaryTags: r.dietaryTags,
    ingredientCount: num(r.ingredientCount),
    instructions: [],
  }));
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredientLine[];
  allergens: string[];
}

export async function getRecipeById(id: string): Promise<RecipeDetail | null> {
  const rows = await runQuery<{
    id: string;
    name: string;
    description: string;
    prepMinutes: unknown;
    cookMinutes: unknown;
    servings: unknown;
    difficulty: Recipe["difficulty"];
    instructions: string[];
    cuisine: string | null;
    dietaryTags: string[];
    ingredients: {
      id: string;
      name: string;
      category: IngredientCategory;
      quantity: string;
      unit: string;
      optional: boolean;
      allergens: string[];
    }[];
  }>(
    `MATCH (r:Recipe {id: $id})
     OPTIONAL MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
     OPTIONAL MATCH (r)-[:TAGGED]->(t:DietaryTag)
     WITH r, c, collect(DISTINCT t.name) AS dietaryTags
     OPTIONAL MATCH (r)-[u:USES]->(i:Ingredient)
     OPTIONAL MATCH (i)-[:CONTAINS_ALLERGEN]->(a:Allergen)
     WITH r, c, dietaryTags, i, u, collect(DISTINCT a.name) AS ingredientAllergens
     WITH r, c, dietaryTags,
          collect(CASE WHEN i IS NULL THEN NULL ELSE {
            id: i.id, name: i.name, category: i.category,
            quantity: u.quantity, unit: u.unit, optional: u.optional,
            allergens: ingredientAllergens
          } END) AS ingredients
     RETURN r.id AS id, r.name AS name, r.description AS description,
            r.prepMinutes AS prepMinutes, r.cookMinutes AS cookMinutes,
            r.servings AS servings, r.difficulty AS difficulty,
            r.instructions AS instructions, c.name AS cuisine, dietaryTags,
            [x IN ingredients WHERE x IS NOT NULL] AS ingredients`,
    { id }
  );

  if (rows.length === 0) return null;
  const row = rows[0];

  const ingredients = row.ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    optional: i.optional,
    allergens: i.allergens,
  }));

  const allergens = Array.from(new Set(ingredients.flatMap((i) => i.allergens)));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prepMinutes: num(row.prepMinutes),
    cookMinutes: num(row.cookMinutes),
    servings: num(row.servings),
    difficulty: row.difficulty,
    instructions: row.instructions,
    cuisine: row.cuisine ?? undefined,
    dietaryTags: row.dietaryTags,
    ingredients,
    allergens,
  };
}

export interface IngredientListItem {
  id: string;
  name: string;
  category: IngredientCategory;
  allergens: string[];
}

export async function listIngredients(search = ""): Promise<IngredientListItem[]> {
  const rows = await runQuery<{
    id: string;
    name: string;
    category: IngredientCategory;
    allergens: string[];
  }>(
    `MATCH (i:Ingredient)
     WHERE $search = "" OR toLower(i.name) CONTAINS toLower($search)
     OPTIONAL MATCH (i)-[:CONTAINS_ALLERGEN]->(a:Allergen)
     WITH i, collect(DISTINCT a.name) AS allergens
     RETURN i.id AS id, i.name AS name, i.category AS category, allergens
     ORDER BY i.name`,
    { search }
  );
  return rows;
}

export interface IngredientDetail extends IngredientListItem {
  usedInRecipes: { id: string; name: string; cuisine: string; quantity: string; unit: string }[];
  directSubstitutes: { id: string; name: string; ratio: string; context: string }[];
  pairsWith: { id: string; name: string; sharedRecipes: number }[];
}

export async function getIngredientById(id: string): Promise<IngredientDetail | null> {
  const base = await runQuery<{
    id: string;
    name: string;
    category: IngredientCategory;
    allergens: string[];
  }>(
    `MATCH (i:Ingredient {id: $id})
     OPTIONAL MATCH (i)-[:CONTAINS_ALLERGEN]->(a:Allergen)
     RETURN i.id AS id, i.name AS name, i.category AS category, collect(DISTINCT a.name) AS allergens`,
    { id }
  );
  if (base.length === 0) return null;

  const recipeRows = await runQuery<{
    id: string;
    name: string;
    cuisine: string;
    quantity: string;
    unit: string;
  }>(
    `MATCH (r:Recipe)-[u:USES]->(i:Ingredient {id: $id})
     MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
     RETURN r.id AS id, r.name AS name, c.name AS cuisine, u.quantity AS quantity, u.unit AS unit
     ORDER BY r.name`,
    { id }
  );

  const subRows = await runQuery<{ id: string; name: string; ratio: string; context: string }>(
    `MATCH (i:Ingredient {id: $id})-[s:SUBSTITUTE_FOR]->(sub:Ingredient)
     RETURN sub.id AS id, sub.name AS name, s.ratio AS ratio, s.context AS context
     ORDER BY sub.name`,
    { id }
  );

  const pairRows = await runQuery<{ id: string; name: string; sharedRecipes: unknown }>(
    `MATCH (i:Ingredient {id: $id})<-[:USES]-(r:Recipe)-[:USES]->(other:Ingredient)
     WHERE other.id <> $id
     WITH other, count(DISTINCT r) AS sharedRecipes
     RETURN other.id AS id, other.name AS name, sharedRecipes
     ORDER BY sharedRecipes DESC, other.name ASC
     LIMIT 8`,
    { id }
  );

  return {
    ...base[0],
    usedInRecipes: recipeRows,
    directSubstitutes: subRows,
    pairsWith: pairRows.map((p) => ({ ...p, sharedRecipes: num(p.sharedRecipes) })),
  };
}

export async function getSubstitutes(
  ingredientId: string,
  options: { maxHops?: number; avoidAllergens?: string[] } = {}
): Promise<Substitute[]> {
  const requestedHops = options.maxHops ?? 3;
  const maxHops = Math.min(Math.max(Math.floor(requestedHops) || 1, 1), 5);
  const avoidAllergens = options.avoidAllergens ?? [];

  const rows = await runQuery<{
    id: string;
    name: string;
    category: IngredientCategory;
    hops: unknown;
    path: string[];
    steps: { ratio: string; context: string }[];
    allergens: string[];
  }>(
    `MATCH p = shortestPath((start:Ingredient {id: $ingredientId})-[:SUBSTITUTE_FOR*1..${maxHops}]->(sub:Ingredient))
     WHERE sub.id <> $ingredientId
     WITH sub, p, length(p) AS hops,
          [n IN nodes(p) | n.name] AS path,
          [rel IN relationships(p) | {ratio: rel.ratio, context: rel.context}] AS steps
     OPTIONAL MATCH (sub)-[:CONTAINS_ALLERGEN]->(al:Allergen)
     WITH sub, hops, path, steps, collect(DISTINCT al.name) AS allergens
     WHERE size($avoidAllergens) = 0 OR NONE(a IN allergens WHERE a IN $avoidAllergens)
     RETURN sub.id AS id, sub.name AS name, sub.category AS category, hops, path, steps, allergens
     ORDER BY hops ASC, sub.name ASC`,
    { ingredientId, avoidAllergens }
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    hops: num(r.hops),
    path: r.path,
    ratio: r.steps[0]?.ratio ?? "",
    context: r.steps.map((s) => s.context).join(" -> then "),
    allergens: r.allergens,
  }));
}

export interface SubstitutionPathResult {
  found: boolean;
  hops: number;
  path: { id: string; name: string }[];
  steps: { ratio: string; context: string }[];
}

export async function findSubstitutionPath(
  fromId: string,
  toId: string
): Promise<SubstitutionPathResult> {
  const rows = await runQuery<{
    hops: unknown;
    path: { id: string; name: string }[];
    steps: { ratio: string; context: string }[];
  }>(
    `MATCH (a:Ingredient {id: $fromId}), (b:Ingredient {id: $toId})
     MATCH p = shortestPath((a)-[:SUBSTITUTE_FOR*..6]-(b))
     RETURN length(p) AS hops,
            [n IN nodes(p) | {id: n.id, name: n.name}] AS path,
            [rel IN relationships(p) | {ratio: rel.ratio, context: rel.context}] AS steps`,
    { fromId, toId }
  );

  if (rows.length === 0) {
    return { found: false, hops: 0, path: [], steps: [] };
  }

  const row = rows[0];
  return { found: true, hops: num(row.hops), path: row.path, steps: row.steps };
}

export interface PantryMatch {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  prepMinutes: number;
  cookMinutes: number;
  totalRequired: number;
  coveredCount: number;
  coverage: number;
  missingIngredients: string[];
  substitutedIngredients: string[];
}

export async function matchRecipesToPantry(
  haveIds: string[],
  limit = 20
): Promise<PantryMatch[]> {
  const rows = await runQuery<{
    id: string;
    name: string;
    description: string;
    cuisine: string;
    prepMinutes: unknown;
    cookMinutes: unknown;
    totalRequired: unknown;
    coveredCount: unknown;
    coverage: number;
    missingIngredients: string[];
    substitutedIngredients: string[];
  }>(
    `MATCH (r:Recipe)-[u:USES]->(i:Ingredient)
     WHERE u.optional = false
     WITH r, i,
          i.id IN $haveIds AS direct,
          size([(i)-[:SUBSTITUTE_FOR]->(alt:Ingredient) WHERE alt.id IN $haveIds | alt]) > 0 AS viaSub
     WITH r, collect({ingredient: i, covered: direct OR viaSub, direct: direct}) AS lines
     WITH r, lines, size(lines) AS totalRequired,
          size([l IN lines WHERE l.covered]) AS coveredCount
     WHERE coveredCount > 0
     MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
     RETURN r.id AS id, r.name AS name, r.description AS description, c.name AS cuisine,
            r.prepMinutes AS prepMinutes, r.cookMinutes AS cookMinutes,
            totalRequired, coveredCount, toFloat(coveredCount) / totalRequired AS coverage,
            [l IN lines WHERE NOT l.covered | l.ingredient.name] AS missingIngredients,
            [l IN lines WHERE l.covered AND NOT l.direct | l.ingredient.name] AS substitutedIngredients
     ORDER BY coverage DESC, totalRequired ASC
     LIMIT $limit`,
    { haveIds, limit: neo4j.int(limit) }
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    prepMinutes: num(r.prepMinutes),
    cookMinutes: num(r.cookMinutes),
    totalRequired: num(r.totalRequired),
    coveredCount: num(r.coveredCount),
    coverage: r.coverage,
    missingIngredients: r.missingIngredients,
    substitutedIngredients: r.substitutedIngredients,
  }));
}
