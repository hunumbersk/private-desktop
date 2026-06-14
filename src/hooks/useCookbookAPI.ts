import { useCallback } from 'react';

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

/** Hook to sync cookbook with the cloud backend - disabled in static mode */
export function useCookbookAPI() {
  const sync = useCallback((_recipes: RecipeItem[]) => {
    return Promise.resolve({ success: true });
  }, []);

  const create = useCallback((_recipe: RecipeItem) => {
    return Promise.resolve({ success: true });
  }, []);

  const remove = useCallback((_recipeId: string) => {
    return Promise.resolve({ success: true });
  }, []);

  const refetch = useCallback(() => {
    return Promise.resolve({ data: [] as any[] });
  }, []);

  return {
    recipes: [],
    isLoading: false,
    sync,
    create,
    remove,
    refetch,
  };
}
