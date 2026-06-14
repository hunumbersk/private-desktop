import { useCallback } from 'react';

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

/** Hook to sync notes with the cloud backend - disabled in static mode */
export function useNotesAPI() {
  const sync = useCallback((_notes: NoteItem[]) => {
    return Promise.resolve({ success: true });
  }, []);

  const create = useCallback((_note: NoteItem) => {
    return Promise.resolve({ success: true });
  }, []);

  const update = useCallback((_itemId: string, _data: Partial<NoteItem>) => {
    return Promise.resolve({ success: true });
  }, []);

  const remove = useCallback((_itemId: string) => {
    return Promise.resolve({ success: true });
  }, []);

  const refetch = useCallback(() => {
    return Promise.resolve({ data: [] as any[] });
  }, []);

  return {
    notes: [],
    isLoading: false,
    isError: false,
    sync,
    create,
    update,
    remove,
    refetch,
  };
}
