import { useState, useCallback, useEffect } from 'react';
import { listRecipes, createRecipe, updateRecipe, deleteRecipe } from '@/lib/api-client';

export interface RecipeItem {
  recipeId: string;
  name: string;
  ingredients: string;
  steps: string;
  cookTime: number;
  method: string;
  taste: string;
  tags: string;
  linkedRecipeIds: string;
  note: string;
  linkUrl: string;
}

export function useCookbookAPI() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listRecipes();
      if (Array.isArray(data)) {
        setRecipes(data.map((r: any) => ({
          recipeId: r.recipeId,
          name: r.name,
          ingredients: r.ingredients || '[]',
          steps: r.steps || '[]',
          cookTime: r.cookTime || 15,
          method: r.method || '',
          taste: r.taste || '',
          tags: r.tags || '[]',
          linkedRecipeIds: r.linkedRecipeIds || '[]',
          note: r.note || '',
          linkUrl: r.linkUrl || '',
        })));
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const sync = useCallback(async (recipesData: RecipeItem[]) => {
    for (const recipe of recipesData) {
      try { await createRecipe(recipe); } catch { /* ignore duplicates */ }
    }
    await fetchRecipes();
  }, [fetchRecipes]);

  const create = useCallback(async (recipe: RecipeItem) => {
    const data = await createRecipe(recipe);
    await fetchRecipes();
    return data;
  }, [fetchRecipes]);

  const remove = useCallback(async (recipeId: string) => {
    await deleteRecipe(recipeId);
    await fetchRecipes();
  }, [fetchRecipes]);

  const refetch = useCallback(() => fetchRecipes(), [fetchRecipes]);

  return { recipes, isLoading, sync, create, remove, refetch };
}
