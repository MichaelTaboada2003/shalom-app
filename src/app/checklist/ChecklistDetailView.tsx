'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Circle, CheckCircle2, GripVertical, CornerDownRight, Edit2, X, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  parent_id: string | null;
}

interface ChecklistDetailProps {
  activeList: any;
  setActiveList: (list: any) => void;
  fetchChecklists: () => void;
}

function SortableItem({ item, toggleItem, deleteItem, indent = 0, updateItemText, onAddSubItem, hasChildren, isExpanded, onToggleExpand }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${indent * 1.5}rem`,
  };

  const handleSave = () => {
    if (editText.trim() !== item.text) {
      updateItemText(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 bg-bg-card transition-colors ${item.completed ? 'opacity-60' : ''}`}>
      <button className="touch-none text-text-muted hover:text-text-primary" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>

      {indent === 0 && (
        <button 
          onClick={() => hasChildren && onToggleExpand(item.id)} 
          className={`shrink-0 transition-colors ${hasChildren ? 'text-text-muted hover:text-text-primary cursor-pointer' : 'opacity-0 cursor-default'}`} 
          disabled={!hasChildren}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      )}

      <button onClick={() => toggleItem(item)} className="shrink-0 transition-transform active:scale-90">
        {item.completed ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} className="text-text-muted" />}
      </button>
      
      {isEditing ? (
        <div className="flex-1 flex gap-1 items-center">
          <input 
            type="text" 
            value={editText} 
            onChange={e => setEditText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 h-8 px-2 rounded bg-bg-primary border border-border-subtle text-sm outline-none focus:border-accent"
          />
          <button onClick={handleSave} className="p-1 text-success hover:bg-success-soft rounded"><Check size={16}/></button>
          <button onClick={() => { setEditText(item.text); setIsEditing(false); }} className="p-1 text-danger hover:bg-danger-soft rounded"><X size={16}/></button>
        </div>
      ) : (
        <span onDoubleClick={() => setIsEditing(true)} className={`flex-1 text-sm ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'} cursor-text`}>
          {item.text}
        </span>
      )}

      {!isEditing && (
        <div className="flex items-center opacity-40 hover:opacity-100 transition-opacity gap-1">
          {indent === 0 && (
            <button onClick={() => onAddSubItem(item.id)} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-soft transition-colors" title="Agregar sub-tarea">
              <CornerDownRight size={14} />
            </button>
          )}
          <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-soft transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ChecklistDetailView({ activeList, setActiveList, fetchChecklists }: ChecklistDetailProps) {
  const [items, setItems] = useState<ChecklistItem[]>(activeList.items);
  const [newItemText, setNewItemText] = useState('');
  const [addingSubItemId, setAddingSubItemId] = useState<string | null>(null);
  const [subItemText, setSubItemText] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setItems(activeList.items);
  }, [activeList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/checklists/${activeList.id}`);
      const data = await res.json();
      setActiveList(data);
      setItems(data.items);
    } catch (err) { console.error(err); }
  };

  const addItem = async (parentId: string | null = null, text: string) => {
    if (!text.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newItem: ChecklistItem = {
      id: tempId,
      text: text.trim(),
      completed: false,
      position: items.length,
      parent_id: parentId
    };
    
    setItems(prev => [...prev, newItem]);
    
    if (parentId) { 
      setSubItemText(''); 
      setAddingSubItemId(null); 
      setExpandedParents(prev => new Set(prev).add(parentId));
    }
    else { setNewItemText(''); }

    try {
      const res = await fetch(`/api/checklists/${activeList.id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), parent_id: parentId }),
      });
      const realItem = await res.json();
      setItems(prev => prev.map(i => i.id === tempId ? realItem : i));
    } catch (err) { 
      console.error(err);
      setItems(prev => prev.filter(i => i.id !== tempId));
    }
  };

  const toggleItem = async (item: ChecklistItem) => {
    try {
      const newCompletedState = !item.completed;
      
      // Optimistic update
      setItems(prev => prev.map(i => {
        if (i.id === item.id) return { ...i, completed: newCompletedState };
        if (!item.parent_id && i.parent_id === item.id) return { ...i, completed: newCompletedState };
        if (item.parent_id && i.id === item.parent_id) {
           const siblings = prev.filter(sibling => sibling.parent_id === item.parent_id && sibling.id !== item.id);
           const allSiblingsCompleted = siblings.every(sibling => sibling.completed);
           return { ...i, completed: newCompletedState && allSiblingsCompleted };
        }
        return i;
      }));

      const updates = [];
      updates.push(
        fetch(`/api/checklists/${activeList.id}/items/${item.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: newCompletedState }),
        })
      );

      if (!item.parent_id) {
        const children = items.filter(i => i.parent_id === item.id);
        for (const child of children) {
          if (child.completed !== newCompletedState) {
            updates.push(
              fetch(`/api/checklists/${activeList.id}/items/${child.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: newCompletedState }),
              })
            );
          }
        }
      } else {
        const siblings = items.filter(i => i.parent_id === item.parent_id && i.id !== item.id);
        const allSiblingsCompleted = siblings.every(i => i.completed);
        const parent = items.find(i => i.id === item.parent_id);
        const newParentState = newCompletedState && allSiblingsCompleted;
        
        if (parent && parent.completed !== newParentState) {
          updates.push(
            fetch(`/api/checklists/${activeList.id}/items/${parent.id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: newParentState }),
            })
          );
        }
      }

      await Promise.all(updates);
    } catch (err) { 
      console.error(err); 
      fetchDetail();
    }
  };

  const updateItemText = async (itemId: string, newText: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, text: newText } : i));
    try {
      await fetch(`/api/checklists/${activeList.id}/items/${itemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });
    } catch (err) { 
      console.error(err);
      fetchDetail();
    }
  };

  const deleteItem = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId && i.parent_id !== itemId));
    try {
      await fetch(`/api/checklists/${activeList.id}/items/${itemId}`, { method: 'DELETE' });
    } catch (err) { 
      console.error(err);
      fetchDetail();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = displayItems.findIndex(i => i.id === active.id);
      const newIndex = displayItems.findIndex(i => i.id === over.id);
      
      const newDisplayItems = arrayMove(displayItems, oldIndex, newIndex);
      
      const draggedItem = displayItems[oldIndex];
      let newParentId = draggedItem.parent_id;

      if (draggedItem.parent_id !== null) {
        const itemAbove = newDisplayItems[newIndex - 1];
        if (itemAbove) {
          newParentId = itemAbove.parent_id || itemAbove.id;
        }
      }

      const updatedItems = newDisplayItems.map((item, index) => {
        if (item.id === draggedItem.id) {
          return { ...item, position: index, parent_id: newParentId };
        }
        return { ...item, position: index };
      });

      // Update the local state so it doesn't snap back
      // Since setItems updates the raw items array, we update all items to match updatedItems
      setItems(prevItems => {
         const newItems = [...prevItems];
         updatedItems.forEach(u => {
            const idx = newItems.findIndex(n => n.id === u.id);
            if (idx !== -1) newItems[idx] = u;
         });
         return newItems;
      });

      const updates = updatedItems.map(item => ({
        id: item.id,
        position: item.position,
        parent_id: item.parent_id
      }));

      fetch(`/api/checklists/${activeList.id}/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates })
      }).catch(console.error);
    }
  };

  const parentItems = items.filter(i => !i.parent_id).sort((a, b) => a.position - b.position);
  
  const completed = parentItems.filter(i => i.completed).length;
  const total = parentItems.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const displayItems = parentItems.flatMap(parent => {
    const children = items.filter(i => i.parent_id === parent.id).sort((a, b) => a.position - b.position);
    if (expandedParents.has(parent.id) || addingSubItemId === parent.id) {
      return [parent, ...children];
    }
    return [parent];
  });

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <button onClick={() => { setActiveList(null); fetchChecklists(); }} className="flex items-center justify-center w-9 h-9 rounded-xl bg-bg-card hover:bg-bg-card-hover border border-border-subtle transition-all active:scale-95">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{activeList.emoji} {activeList.title}</h1>
        </div>
      </motion.header>

      {total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted font-medium">{completed} de {total} completados</span>
            <span className="text-xs font-bold text-accent">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-success" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
          </div>
        </motion.div>
      )}



      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col mb-4">
            {displayItems.map((item, index) => {
              const currentGroupId = item.parent_id || item.id;
              const nextItem = displayItems[index + 1];
              const isLastInGroup = !nextItem || (nextItem.parent_id || nextItem.id) !== currentGroupId;
              const hasChildren = items.some(i => i.parent_id === item.id);
              
              return (
                <React.Fragment key={item.id}>
                  <SortableItem 
                    item={item} 
                    toggleItem={toggleItem} 
                    deleteItem={deleteItem} 
                    updateItemText={updateItemText} 
                    onAddSubItem={(id: string) => {
                      setAddingSubItemId(id);
                      setExpandedParents(prev => new Set(prev).add(id));
                    }} 
                    indent={item.parent_id ? 1 : 0} 
                    hasChildren={hasChildren}
                    isExpanded={expandedParents.has(item.id) || addingSubItemId === item.id}
                    onToggleExpand={toggleExpand}
                  />
                  {addingSubItemId === currentGroupId && isLastInGroup && (
                    <div className="flex gap-2 mb-1.5 ml-6">
                      <input
                        autoFocus type="text" value={subItemText} onChange={e => setSubItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(currentGroupId, subItemText)}
                        placeholder="Sub-elemento..." className="flex-1 h-9 px-3 rounded-lg bg-bg-elevated border border-border-subtle text-sm outline-none focus:border-accent transition-colors"
                      />
                      <button onClick={() => addItem(currentGroupId, subItemText)} disabled={!subItemText.trim()} className="px-3 rounded-lg bg-accent text-white text-xs font-medium disabled:opacity-40">Add</button>
                      <button onClick={() => { setAddingSubItemId(null); setSubItemText(''); }} className="px-3 rounded-lg bg-bg-card border border-border-subtle text-xs font-medium text-text-secondary">Cancel</button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <input
          type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(null, newItemText)}
          placeholder="Agregar elemento..." className="flex-1 h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
        />
        <button onClick={() => addItem(null, newItemText)} disabled={!newItemText.trim()} className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-accent/90 transition-all active:scale-95 shrink-0">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
