import { IngredientCategory } from "@/lib/types";

export const CUISINE_ICONS: Record<string, string> = {
  Italian: "🍝",
  Mexican: "🌮",
  Indian: "🍛",
  Japanese: "🍣",
  Thai: "🍜",
  Mediterranean: "🥙",
  American: "🍔",
  French: "🥖",
  Korean: "🍚",
  "Middle Eastern": "🧆",
  Chinese: "🥢",
  Vietnamese: "🍲",
};

export function cuisineIcon(name?: string) {
  if (!name) return "🍽️";
  return CUISINE_ICONS[name] ?? "🍽️";
}

export const CATEGORY_ICONS: Record<IngredientCategory, string> = {
  produce: "🥬",
  protein: "🍗",
  seafood: "🦐",
  dairy: "🧀",
  egg: "🥚",
  grain: "🌾",
  legume: "🫘",
  "nut-seed": "🥜",
  oil: "🫒",
  "dairy-free": "🌱",
  sweetener: "🍯",
  condiment: "🧂",
  spice: "🌶️",
  other: "🍲",
};

export function categoryIcon(category: IngredientCategory) {
  return CATEGORY_ICONS[category] ?? "🍲";
}

export const ALLERGEN_ICONS: Record<string, string> = {
  gluten: "🌾",
  dairy: "🥛",
  egg: "🥚",
  peanut: "🥜",
  "tree-nut": "🌰",
  soy: "🫘",
  shellfish: "🦐",
  fish: "🐟",
  sesame: "🫙",
};
