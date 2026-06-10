import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNotesAPI } from './useNotesAPI';
import { useCookbookAPI } from './useCookbookAPI';
import { useNotesStore } from './useNotesStore';
import { useCookbookStore } from './useCookbookStore';

/** Cross-device data sync hook.
 * Pulls cloud data on login, pushes local changes to cloud.
 */
export function useDataSync() {
  const { isAuthenticated } = useAuth();
  const notesAPI = useNotesAPI();
  const cookbookAPI = useCookbookAPI();
  const notesLocal = useNotesStore();
  const cookbookLocal = useCookbookStore();
  const hasPulled = useRef(false);

  // Pull from cloud on login
  useEffect(() => {
    if (!isAuthenticated || hasPulled.current) return;
    hasPulled.current = true;

    // Pull notes
    notesAPI.refetch().then(({ data }) => {
      if (data && data.length > 0) {
        // Convert DB rows to local format and save
        const items: Record<string, any> = {};
        data.forEach((row: any) => {
          items[row.itemId] = {
            id: row.itemId,
            title: row.title,
            type: row.type,
            module: row.module,
            content: row.content || '',
            tags: JSON.parse(row.tags || '[]'),
            linkedNoteIds: JSON.parse(row.linkedNoteIds || '[]'),
            children: JSON.parse(row.children || '[]'),
            parentId: row.parentId,
            snapshots: JSON.parse(row.snapshots || '[]'),
            synopsis: row.synopsis || '',
            status: row.status || '',
            wordCountTarget: row.wordCountTarget || 0,
            x: row.x,
            y: row.y,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
        });
        try {
          localStorage.setItem('private-desktop-notes-v2', JSON.stringify(items));
          window.location.reload();
        } catch { /* ignore */ }
      }
    }).catch(() => {});

    // Pull recipes
    cookbookAPI.refetch().then(({ data }) => {
      if (data && data.length > 0) {
        const recipes = data.map((row: any) => ({
          id: row.recipeId,
          name: row.name,
          ingredients: JSON.parse(row.ingredients || '[]'),
          steps: JSON.parse(row.steps || '[]'),
          cookTime: row.cookTime,
          method: row.method,
          taste: row.taste,
          tags: JSON.parse(row.tags || '[]'),
          linkedRecipeIds: JSON.parse(row.linkedRecipeIds || '[]'),
          note: row.note || '',
          linkUrl: row.linkUrl || '',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
        try {
          localStorage.setItem('private-desktop-cookbook-v2', JSON.stringify(recipes));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  // Push local notes to cloud
  const pushNotes = useCallback(() => {
    if (!isAuthenticated) return;
    const items = notesLocal.items;
    const notes = Object.values(items).map(item => ({
      itemId: item.id,
      title: item.title,
      type: item.type,
      module: item.module,
      content: item.content,
      synopsis: item.synopsis,
      status: item.status,
      tags: JSON.stringify(item.tags),
      linkedNoteIds: JSON.stringify(item.linkedNoteIds),
      children: JSON.stringify(item.children),
      parentId: item.parentId,
      snapshots: JSON.stringify(item.snapshots),
      wordCountTarget: item.wordCountTarget,
      x: item.x || 0,
      y: item.y || 0,
    }));
    notesAPI.sync(notes).catch(() => {});
  }, [isAuthenticated, notesLocal.items, notesAPI]);

  // Push local recipes to cloud
  const pushRecipes = useCallback(() => {
    if (!isAuthenticated) return;
    const recipes = cookbookLocal.recipes.map(r => ({
      recipeId: r.id,
      name: r.name,
      ingredients: JSON.stringify(r.ingredients),
      steps: JSON.stringify(r.steps),
      cookTime: r.cookTime,
      method: r.method,
      taste: r.taste,
      tags: JSON.stringify(r.tags),
      linkedRecipeIds: JSON.stringify(r.linkedRecipeIds),
      note: r.note,
      linkUrl: r.linkUrl,
    }));
    cookbookAPI.sync(recipes).catch(() => {});
  }, [isAuthenticated, cookbookLocal.recipes, cookbookAPI]);

  // Auto-push every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      pushNotes();
      pushRecipes();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pushNotes, pushRecipes]);

  return {
    pushNotes,
    pushRecipes,
    isCloudEnabled: isAuthenticated,
  };
}
