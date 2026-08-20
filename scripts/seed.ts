import { config } from "dotenv";
import neo4j from "neo4j-driver";
import {
  CUISINES,
  DIETARY_TAGS,
  ALLERGENS,
  INGREDIENTS,
  SUBSTITUTIONS,
  RECIPES,
} from "../src/data/seed-data";

config({ path: ".env.local" });
config();

function slug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER;
const password = process.env.COGNODB_PASSWORD;

if (!uri || !user || !password) {
  console.error(
    "Missing COGNODB_URI / COGNODB_USER / COGNODB_PASSWORD.\n" +
      "Copy .env.example to .env.local, fill in your CognoDB Cloud credentials, and try again."
  );
  process.exit(1);
}

const knownIngredientIds = new Set(INGREDIENTS.map((i) => slug(i.name)));

function assertKnownIngredient(name: string, where: string) {
  const id = slug(name);
  if (!knownIngredientIds.has(id)) {
    throw new Error(`"${name}" (used in ${where}) is not in the INGREDIENTS list. Fix the typo or add it.`);
  }
  return id;
}

const recipeNodes = RECIPES.map((r) => ({
  id: slug(r.name),
  name: r.name,
  description: r.description,
  prepMinutes: r.prepMinutes,
  cookMinutes: r.cookMinutes,
  servings: r.servings,
  difficulty: r.difficulty,
  instructions: r.instructions,
}));

const ingredientNodes = INGREDIENTS.map((i) => ({
  id: slug(i.name),
  name: i.name,
  category: i.category,
}));

const usesEdges = RECIPES.flatMap((r) =>
  r.ingredients.map((ing) => ({
    recipeId: slug(r.name),
    ingredientId: assertKnownIngredient(ing.name, `recipe "${r.name}"`),
    quantity: ing.quantity,
    unit: ing.unit,
    optional: Boolean(ing.optional),
  }))
);

const cuisineEdges = RECIPES.map((r) => {
  if (!CUISINES.includes(r.cuisine)) {
    throw new Error(`Recipe "${r.name}" has unknown cuisine "${r.cuisine}"`);
  }
  return { recipeId: slug(r.name), cuisine: r.cuisine };
});

const tagEdges = RECIPES.flatMap((r) =>
  r.dietaryTags.map((tag) => {
    if (!DIETARY_TAGS.includes(tag)) {
      throw new Error(`Recipe "${r.name}" has unknown dietary tag "${tag}"`);
    }
    return { recipeId: slug(r.name), tag };
  })
);

const allergenEdges = INGREDIENTS.flatMap((i) =>
  (i.allergens ?? []).map((allergen) => {
    if (!ALLERGENS.includes(allergen)) {
      throw new Error(`Ingredient "${i.name}" has unknown allergen "${allergen}"`);
    }
    return { ingredientId: slug(i.name), allergen };
  })
);

const substitutionEdges = SUBSTITUTIONS.map((s) => ({
  fromId: assertKnownIngredient(s.from, `substitution "${s.from} -> ${s.to}"`),
  toId: assertKnownIngredient(s.to, `substitution "${s.from} -> ${s.to}"`),
  ratio: s.ratio,
  context: s.context,
}));

async function main() {
  const driver = neo4j.driver(uri!, neo4j.auth.basic(user!, password!));
  const session = driver.session();

  try {
    await session.run("RETURN 1");
    console.log("Connected to CognoDB.");

    console.log("Wiping existing graph...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints...");
    const constraints = [
      "CREATE CONSTRAINT recipe_id IF NOT EXISTS FOR (r:Recipe) REQUIRE r.id IS UNIQUE",
      "CREATE CONSTRAINT ingredient_id IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.id IS UNIQUE",
      "CREATE CONSTRAINT cuisine_name IF NOT EXISTS FOR (c:Cuisine) REQUIRE c.name IS UNIQUE",
      "CREATE CONSTRAINT dietary_tag_name IF NOT EXISTS FOR (t:DietaryTag) REQUIRE t.name IS UNIQUE",
      "CREATE CONSTRAINT allergen_name IF NOT EXISTS FOR (a:Allergen) REQUIRE a.name IS UNIQUE",
    ];
    for (const c of constraints) {
      await session.run(c);
    }

    console.log(`Loading ${ingredientNodes.length} ingredients...`);
    await session.run(
      `UNWIND $rows AS row
       MERGE (i:Ingredient {id: row.id})
       SET i.name = row.name, i.category = row.category`,
      { rows: ingredientNodes }
    );

    console.log(`Loading ${CUISINES.length} cuisines...`);
    await session.run(
      `UNWIND $rows AS name MERGE (c:Cuisine {name: name})`,
      { rows: CUISINES }
    );

    console.log(`Loading ${DIETARY_TAGS.length} dietary tags...`);
    await session.run(
      `UNWIND $rows AS name MERGE (t:DietaryTag {name: name})`,
      { rows: DIETARY_TAGS }
    );

    console.log(`Loading ${ALLERGENS.length} allergens...`);
    await session.run(
      `UNWIND $rows AS name MERGE (a:Allergen {name: name})`,
      { rows: ALLERGENS }
    );

    console.log(`Loading ${recipeNodes.length} recipes...`);
    await session.run(
      `UNWIND $rows AS row
       MERGE (r:Recipe {id: row.id})
       SET r.name = row.name,
           r.description = row.description,
           r.prepMinutes = row.prepMinutes,
           r.cookMinutes = row.cookMinutes,
           r.servings = row.servings,
           r.difficulty = row.difficulty,
           r.instructions = row.instructions`,
      { rows: recipeNodes }
    );

    console.log(`Linking ${usesEdges.length} recipe-ingredient uses...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (r:Recipe {id: row.recipeId})
       MATCH (i:Ingredient {id: row.ingredientId})
       MERGE (r)-[u:USES]->(i)
       SET u.quantity = row.quantity, u.unit = row.unit, u.optional = row.optional`,
      { rows: usesEdges }
    );

    console.log(`Linking ${cuisineEdges.length} recipe-cuisine edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (r:Recipe {id: row.recipeId})
       MATCH (c:Cuisine {name: row.cuisine})
       MERGE (r)-[:BELONGS_TO]->(c)`,
      { rows: cuisineEdges }
    );

    console.log(`Linking ${tagEdges.length} recipe-dietary tag edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (r:Recipe {id: row.recipeId})
       MATCH (t:DietaryTag {name: row.tag})
       MERGE (r)-[:TAGGED]->(t)`,
      { rows: tagEdges }
    );

    console.log(`Linking ${allergenEdges.length} ingredient-allergen edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (i:Ingredient {id: row.ingredientId})
       MATCH (a:Allergen {name: row.allergen})
       MERGE (i)-[:CONTAINS_ALLERGEN]->(a)`,
      { rows: allergenEdges }
    );

    console.log(`Linking ${substitutionEdges.length} substitution edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (from:Ingredient {id: row.fromId})
       MATCH (to:Ingredient {id: row.toId})
       MERGE (from)-[s:SUBSTITUTE_FOR]->(to)
       SET s.ratio = row.ratio, s.context = row.context`,
      { rows: substitutionEdges }
    );

    const counts = await session.run(
      `MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label`
    );
    console.log("\nSeed complete. Node counts:");
    for (const record of counts.records) {
      console.log(`  ${record.get("label")}: ${record.get("count").toNumber()}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
