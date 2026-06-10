import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

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
  const utils = trpc.useUtils();
  const listQuery = trpc.cookbook.list.useQuery(undefined, { retry: 1, staleTime: 30000 });
  const syncMutation = trpc.cookbook.sync.useMutation({
    onSuccess: () => utils.cookbook.list.invalidate(),
  });
  const createMutation = trpc.cookbook.create.useMutation({
    onSuccess: () => utils.cookbook.list.invalidate(),
  });
  const deleteMutation = trpc.cookbook.delete.useMutation({
    onSuccess: () => utils.cookbook.list.invalidate(),
  });

  const sync = useCallback((recipes: RecipeItem[]) => {
    return syncMutation.mutateAsync(recipes);
  }, [syncMutation]);

  const create = useCallback((recipe: RecipeItem) => {
    return createMutation.mutateAsync(recipe as any);
  }, [createMutation]);

  const remove = useCallback((recipeId: string) => {
    return deleteMutation.mutateAsync({ recipeId });
  }, [deleteMutation]);

  return {
    recipes: listQuery.data || [],
    isLoading: listQuery.isLoading,
    sync,
    create,
    remove,
    refetch: listQuery.refetch,
  };
}
