export type IngredientCategory =
  | "produce"
  | "protein"
  | "seafood"
  | "dairy"
  | "egg"
  | "grain"
  | "legume"
  | "nut-seed"
  | "oil"
  | "dairy-free"
  | "sweetener"
  | "condiment"
  | "spice"
  | "other";

export type Difficulty = "easy" | "medium" | "hard";

export interface IngredientSeed {
  name: string;
  category: IngredientCategory;
  allergens?: string[];
}

export interface SubstitutionSeed {
  from: string;
  to: string;
  ratio: string;
  context: string;
}

export interface RecipeIngredientSeed {
  name: string;
  quantity: string;
  unit: string;
  optional?: boolean;
}

export interface RecipeSeed {
  name: string;
  cuisine: string;
  dietaryTags: string[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  difficulty: Difficulty;
  description: string;
  instructions: string[];
  ingredients: RecipeIngredientSeed[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  difficulty: Difficulty;
  instructions: string[];
  cuisine?: string;
  dietaryTags?: string[];
}

export interface RecipeIngredientLine {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: string;
  unit: string;
  optional: boolean;
  allergens: string[];
}

export interface Substitute {
  id: string;
  name: string;
  category: IngredientCategory;
  ratio: string;
  context: string;
  hops: number;
  path: string[];
  allergens: string[];
}
