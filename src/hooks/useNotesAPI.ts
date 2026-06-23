import { useState, useCallback, useEffect } from 'react';
import { listNotes, createNote, updateNote, deleteNote } from '@/lib/api-client';

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
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await listNotes();
      if (Array.isArray(data)) {
        setNotes(data.map((n: any) => ({
          itemId: n.itemId,
          title: n.title,
          type: n.type,
          module: n.module,
          content: n.content || '',
          synopsis: n.synopsis || '',
          status: n.status || '',
          tags: n.tags || '[]',
          linkedNoteIds: n.linkedNoteIds || '[]',
          children: n.children || '[]',
          parentId: n.parentId || null,
          snapshots: n.snapshots || '[]',
          wordCountTarget: n.wordCountTarget || 0,
          x: n.x ?? null,
          y: n.y ?? null,
        })));
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const sync = useCallback(async (notesData: NoteItem[]) => {
    for (const note of notesData) {
      try {
        await createNote(note);
      } catch { /* ignore duplicates */ }
    }
    await fetchNotes();
  }, [fetchNotes]);

  const create = useCallback(async (note: NoteItem) => {
    const data = await createNote(note);
    await fetchNotes();
    return data;
  }, [fetchNotes]);

  const update = useCallback(async (itemId: string, data: Partial<NoteItem>) => {
    const result = await updateNote(itemId, data);
    await fetchNotes();
    return result;
  }, [fetchNotes]);

  const remove = useCallback(async (itemId: string) => {
    await deleteNote(itemId);
    await fetchNotes();
  }, [fetchNotes]);

  const refetch = useCallback(() => fetchNotes(), [fetchNotes]);

  return { notes, isLoading, isError, sync, create, update, remove, refetch };
}
