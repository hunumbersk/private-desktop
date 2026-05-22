import { useState, useEffect, useCallback } from 'react';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedNoteIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TagLink {
  tag: string;
  noteIds: string[];
}

const STORAGE_KEY = 'private-desktop-notes';

function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [
    {
      id: 'note-1',
      title: '想法记录',
      content: '这是我的第一个笔记。\n\n可以在这里记录各种想法，并添加标签来标记它们之间的关联。',
      tags: ['想法'],
      linkedNoteIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-2',
      title: '项目计划',
      content: '项目相关的内容可以记录在这里。\n\n和"想法记录"笔记使用相同的标签即可建立关联。',
      tags: ['项目', '想法'],
      linkedNoteIds: ['note-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch { /* ignore */ }
}

export function useNotesStore() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const addNote = useCallback((title: string, content: string = '', tags: string[] = []) => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      content,
      tags,
      linkedNoteIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote.id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'linkedNoteIds'>>) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const filtered = prev.filter(n => n.id !== id);
      // Remove references from other notes
      return filtered.map(n => ({
        ...n,
        linkedNoteIds: n.linkedNoteIds.filter(lid => lid !== id),
      }));
    });
  }, []);

  const appendContent = useCallback((noteId: string, content: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, content: note.content + content, updatedAt: new Date().toISOString() }
        : note
    ));
  }, []);

  const toggleLink = useCallback((noteId: string, targetId: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      const hasLink = note.linkedNoteIds.includes(targetId);
      return {
        ...note,
        linkedNoteIds: hasLink
          ? note.linkedNoteIds.filter(id => id !== targetId)
          : [...note.linkedNoteIds, targetId],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const addTag = useCallback((noteId: string, tag: string) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      if (note.tags.includes(cleanTag)) return note;
      return { ...note, tags: [...note.tags, cleanTag], updatedAt: new Date().toISOString() };
    }));
  }, []);

  const removeTag = useCallback((noteId: string, tag: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      return { ...note, tags: note.tags.filter(t => t !== tag), updatedAt: new Date().toISOString() };
    }));
  }, []);

  const getRelatedNotes = useCallback((noteId: string): Note[] => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return [];

    // Find notes with same tags or direct links
    const related = notes.filter(n => {
      if (n.id === noteId) return false;
      const hasSharedTag = n.tags.some(t => note.tags.includes(t));
      const isLinked = note.linkedNoteIds.includes(n.id) || n.linkedNoteIds.includes(note.id);
      return hasSharedTag || isLinked;
    });

    return related;
  }, [notes]);

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const getTagNetwork = useCallback((): TagLink[] => {
    const tagMap = new Map<string, Set<string>>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set());
        tagMap.get(tag)!.add(note.id);
      });
    });
    return Array.from(tagMap.entries())
      .map(([tag, noteIds]) => ({ tag, noteIds: Array.from(noteIds) }))
      .sort((a, b) => b.noteIds.length - a.noteIds.length);
  }, [notes]);

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    toggleLink,
    addTag,
    removeTag,
    getRelatedNotes,
    getAllTags,
    getTagNetwork,
    appendContent,
  };
}
