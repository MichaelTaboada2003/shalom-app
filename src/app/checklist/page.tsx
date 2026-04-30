'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ArrowLeft, Circle, CheckCircle2,
} from 'lucide-react';
import { ChecklistDetailView } from './ChecklistDetailView';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
}

interface ChecklistSummary {
  id: string;
  title: string;
  emoji: string;
  created_at: string;
  total_items: number;
  completed_items: number;
}

interface ChecklistDetail extends ChecklistSummary {
  items: ChecklistItem[];
}

const EMOJI_OPTIONS = ['📋', '⛪', '🎵', '🙏', '📖', '🎉', '🍞', '🕯️', '💒', '🎤'];

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
  const [activeList, setActiveList] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('📋');

  const fetchChecklists = useCallback(async () => {
    try {
      const res = await fetch('/api/checklists');
      setChecklists(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/checklists/${id}`);
      setActiveList(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchChecklists(); }, [fetchChecklists]);

  const createChecklist = useCallback(async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle.trim(), emoji: newListEmoji }),
      });
      const newList = await res.json();
      setNewListTitle(''); setNewListEmoji('📋'); setShowNewListForm(false);
      await fetchChecklists();
      await fetchDetail(newList.id);
    } catch (err) { console.error(err); }
  }, [newListTitle, newListEmoji, fetchChecklists, fetchDetail]);

  const deleteChecklist = useCallback(async (id: string) => {
    try {
      await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
      if (activeList?.id === id) setActiveList(null);
      fetchChecklists();
    } catch (err) { console.error(err); }
  }, [activeList, fetchChecklists]);

  const addItem = useCallback(async () => {
    if (!newItemText.trim() || !activeList) return;
    try {
      await fetch(`/api/checklists/${activeList.id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newItemText.trim() }),
      });
      setNewItemText('');
      fetchDetail(activeList.id);
    } catch (err) { console.error(err); }
  }, [newItemText, activeList, fetchDetail]);

  const toggleItem = useCallback(async (item: ChecklistItem) => {
    if (!activeList) return;
    try {
      await fetch(`/api/checklists/${activeList.id}/items/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed }),
      });
      fetchDetail(activeList.id);
    } catch (err) { console.error(err); }
  }, [activeList, fetchDetail]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!activeList) return;
    try {
      await fetch(`/api/checklists/${activeList.id}/items/${itemId}`, { method: 'DELETE' });
      fetchDetail(activeList.id);
    } catch (err) { console.error(err); }
  }, [activeList, fetchDetail]);

  const completed = activeList?.items.filter(i => i.completed).length || 0;
  const total = activeList?.items.length || 0;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  // ─── Detail View ───
  if (activeList) {
    return <ChecklistDetailView activeList={activeList} setActiveList={setActiveList} fetchChecklists={fetchChecklists} />;
  }

  // ─── List View ───
  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
        <p className="text-text-secondary text-sm mt-1">Organiza tus actividades</p>
      </motion.header>

      {/* New list form */}
      <AnimatePresence>
        {showNewListForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl border border-border-accent bg-bg-elevated flex flex-col gap-3">
              <div className="flex gap-1.5 flex-wrap justify-center">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewListEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${newListEmoji === e ? 'bg-accent-soft border border-accent scale-110' : 'bg-bg-card border border-border-subtle'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createChecklist()}
                placeholder="Nombre de la lista..."
                autoFocus
                className="h-11 px-4 rounded-xl bg-bg-primary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowNewListForm(false)} className="flex-1 h-10 rounded-xl bg-bg-card border border-border-subtle text-xs font-semibold text-text-secondary active:scale-[0.98]">Cancelar</button>
                <button onClick={createChecklist} disabled={!newListTitle.trim()} className="flex-1 h-10 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40 active:scale-[0.98]">Crear</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showNewListForm && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNewListForm(true)}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border-2 border-dashed border-border-subtle text-text-secondary text-sm font-medium hover:border-accent/40 hover:text-accent hover:bg-accent-soft transition-all active:scale-[0.98] mb-4"
        >
          <Plus size={18} /> Nueva Lista
        </motion.button>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {checklists.map((list, i) => {
          const p = list.total_items > 0 ? (list.completed_items / list.total_items) * 100 : 0;
          return (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => fetchDetail(list.id)}
              className="relative p-4 rounded-2xl bg-bg-card border border-border-subtle hover:border-border-medium cursor-pointer transition-all active:scale-[0.97] flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <span className="text-2xl">{list.emoji}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteChecklist(list.id); }}
                  className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-text-primary truncate">{list.title}</h3>
              {list.total_items > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${p}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">{list.completed_items}/{list.total_items}</span>
                </div>
              ) : (
                <span className="text-[10px] text-text-muted">Sin elementos</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {!loading && checklists.length === 0 && !showNewListForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-sm text-text-secondary">No tienes listas aún</p>
          <p className="text-xs text-text-muted">Crea tu primera checklist</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
