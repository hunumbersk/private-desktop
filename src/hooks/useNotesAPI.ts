import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

export interface NoteItem {
  itemId: string;
  title: string;
  type: 'folder' | 'document';
  module: 'general' | 'academic' | 'novel';
  content: string;
  synopsis: string;
  status: string;
  tags: string;
  linkedNoteIds: string;
  children: string;
  parentId: string | null;
  snapshots: string;
  wordCountTarget: number;
  x: number | null;
  y: number | null;
}

export function useNotesAPI() {
  const utils = trpc.useUtils();
  const listQuery = trpc.note.list.useQuery(undefined, { retry: 1, staleTime: 30000 });
  const syncMutation = trpc.note.sync.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });
  const createMutation = trpc.note.create.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });
  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });
  const deleteMutation = trpc.note.delete.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
  });

  const sync = useCallback((notes: NoteItem[]) => {
    return syncMutation.mutateAsync(notes as any);
  }, [syncMutation]);

  const create = useCallback((note: NoteItem) => {
    return createMutation.mutateAsync(note as any);
  }, [createMutation]);

  const update = useCallback((itemId: string, data: Partial<NoteItem>) => {
    return updateMutation.mutateAsync({ itemId, ...data } as any);
  }, [updateMutation]);

  const remove = useCallback((itemId: string) => {
    return deleteMutation.mutateAsync({ itemId });
  }, [deleteMutation]);

  return {
    notes: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    sync,
    create,
    update,
    remove,
    refetch: listQuery.refetch,
  };
}
