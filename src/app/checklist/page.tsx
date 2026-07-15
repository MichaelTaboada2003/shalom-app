'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Trash2, UsersRound } from 'lucide-react';
import { ChecklistDetailView } from './ChecklistDetailView';
import { ChecklistIcon, CHECKLIST_ICON_OPTIONS, type ChecklistIconName } from '@/components/checklist-icon';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';

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
  visibility: 'community' | 'personal';
  owner_id: string | null;
}

interface ChecklistDetail extends ChecklistSummary {
  items: ChecklistItem[];
}

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
  const [activeList, setActiveList] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListIcon, setNewListIcon] = useState<ChecklistIconName>('clipboard');
  const [newListVisibility, setNewListVisibility] = useState<'community' | 'personal'>('community');
  const [listPendingDeletion, setListPendingDeletion] = useState<ChecklistSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        body: JSON.stringify({ title: newListTitle.trim(), icon: newListIcon, visibility: newListVisibility }),
      });
      const newList = await res.json();
      if (!res.ok) throw new Error(newList.error || 'No se pudo crear la lista');
      setNewListTitle(''); setNewListIcon('clipboard'); setNewListVisibility('community'); setShowNewListForm(false);
      await fetchChecklists();
      await fetchDetail(newList.id);
    } catch (err) { console.error(err); }
  }, [newListTitle, newListIcon, newListVisibility, fetchChecklists, fetchDetail]);

  const deleteChecklist = useCallback(async () => {
    if (!listPendingDeletion) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/checklists/${listPendingDeletion.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar la lista');
      if (activeList?.id === listPendingDeletion.id) setActiveList(null);
      setListPendingDeletion(null);
      await fetchChecklists();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  }, [activeList, fetchChecklists, listPendingDeletion]);

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
                {CHECKLIST_ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewListIcon(icon)}
                    aria-label={`Elegir icono ${icon}`}
                    aria-pressed={newListIcon === icon}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${newListIcon === icon ? 'scale-110 border border-accent bg-accent-soft text-text-primary' : 'border border-border-subtle bg-bg-card text-text-muted hover:text-text-secondary'}`}
                  >
                    <ChecklistIcon name={icon} size={18} />
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
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-bg-primary/70 p-1.5" role="group" aria-label="Visibilidad de la lista">
                <button type="button" onClick={() => setNewListVisibility('community')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${newListVisibility === 'community' ? 'bg-accent-soft text-text-primary shadow-sm ring-1 ring-accent/40' : 'text-text-muted hover:text-text-secondary'}`}><UsersRound size={15} /> Para la comunidad</button>
                <button type="button" onClick={() => setNewListVisibility('personal')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${newListVisibility === 'personal' ? 'bg-accent-soft text-text-primary shadow-sm ring-1 ring-accent/40' : 'text-text-muted hover:text-text-secondary'}`}><Lock size={14} /> Solo para mí</button>
              </div>
              <p className="px-1 text-[11px] leading-5 text-text-muted">{newListVisibility === 'community' ? 'Todos podrán ver y colaborar en esta lista.' : 'Solo tú podrás ver y editar esta lista.'}</p>
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
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><ChecklistIcon name={list.emoji} size={20} /></span>
                <button
                  onClick={e => { e.stopPropagation(); setListPendingDeletion(list); }}
                  className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex min-w-0 items-center gap-2"><h3 className="truncate text-sm font-semibold text-text-primary">{list.title}</h3><span title={list.visibility === 'community' ? 'Lista comunitaria' : 'Lista personal'} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${list.visibility === 'community' ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent'}`}>{list.visibility === 'community' ? <UsersRound size={12} /> : <Lock size={11} />}</span></div>
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
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-accent-soft text-accent"><ChecklistIcon name="clipboard" size={30} /></span>
          <p className="text-sm text-text-secondary">No tienes listas aún</p>
          <p className="text-xs text-text-muted">Crea tu primera checklist</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <ConfirmDeleteDialog open={Boolean(listPendingDeletion)} title="¿Borrar esta lista?" description={<>Vas a eliminar <b className="text-text-primary">{listPendingDeletion?.title}</b> y todos sus elementos. Esta acción no se puede deshacer.</>} onCancel={() => setListPendingDeletion(null)} onConfirm={deleteChecklist} loading={deleting} />
    </div>
  );
}
