'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, RotateCcw, Trash2, ChevronDown,
  Package, DollarSign, Hash, Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetItem {
  id: string;
  material: string;
  units: number;
  pricePerUnit: number;
}

const STORAGE_KEY = 'shalom-retiro-presupuesto';

const DEFAULT_MATERIALS = [
  'Casa de retiro', 'Biblias', 'Transporte', 'Camisetas', 'Botones',
  'Cruz', 'Denario', 'Botiquín', 'Comidas', 'Leña',
  'Cocinera', 'Confesiones y charlistas', 'Vendaje', 'Libreta y lapicero',
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function defaults(): BudgetItem[] {
  return DEFAULT_MATERIALS.map(m => ({ id: uid(), material: m, units: 0, pricePerUnit: 0 }));
}

function load(): BudgetItem[] {
  if (typeof window === 'undefined') return [];
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return defaults();
}

function save(items: BudgetItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
}

export default function PresupuestoPage() {
  const router = useRouter();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [showReset, setShowReset] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // localStorage is only available after client hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(load());
  }, []);
  useEffect(() => { if (items.length > 0) save(items); }, [items]);

  const update = useCallback((id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  }, []);

  const add = useCallback(() => {
    if (!newName.trim()) return;
    const item: BudgetItem = { id: uid(), material: newName.trim(), units: 0, pricePerUnit: 0 };
    setItems(prev => [...prev, item]);
    setNewName('');
    setShowAdd(false);
    setExpandedId(item.id);
  }, [newName]);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [expandedId]);

  const reset = useCallback(() => {
    const d = defaults();
    setItems(d);
    save(d);
    setExpandedId(null);
    setShowReset(false);
  }, []);

  const grandTotal = items.reduce((s, it) => s + it.units * it.pricePerUnit, 0);
  const filledCount = items.filter(it => it.units > 0 && it.pricePerUnit > 0).length;

  const downloadPDF = useCallback(() => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Presupuesto Retiro', 14, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Comunidad Shalom  •  ${dateStr}`, 14, 30);
    doc.setTextColor(0);

    // Table
    const tableData = items.map((it, i) => [
      i + 1,
      it.material,
      it.units,
      fmt(it.pricePerUnit),
      fmt(it.units * it.pricePerUnit),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Material', 'Uds', 'Precio/Ud', 'Total']],
      body: tableData,
      foot: [['', '', '', 'TOTAL', fmt(grandTotal)]],
      theme: 'grid',
      headStyles: { fillColor: [99, 131, 255], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      footStyles: { fillColor: [240, 240, 245], textColor: [15, 15, 26], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 },
      },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`presupuesto-retiro-${now.toISOString().slice(0, 10)}.pdf`);
  }, [items, grandTotal]);

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push('/retiro')} className="flex items-center justify-center w-9 h-9 rounded-xl bg-bg-card hover:bg-bg-card-hover border border-border-subtle transition-all active:scale-95">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Presupuesto</h1>
          <p className="text-text-muted text-xs">{filledCount} de {items.length} materiales con precio</p>
        </div>
      </motion.header>

      {/* Total Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-border-accent bg-gradient-to-br from-accent/10 via-bg-card to-bg-secondary p-5 mb-5"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/5 blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent/70 mb-1">Total General</p>
        <p className="text-3xl font-extrabold tracking-tight text-text-primary">{fmt(grandTotal)}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-text-muted">{items.length} materiales</p>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-semibold hover:bg-accent/25 transition-colors active:scale-95"
          >
            <Download size={14} /> PDF
          </button>
        </div>
      </motion.div>

      {/* Items */}
      <div className="flex flex-col gap-2 mb-4">
        {items.map((item, i) => {
          const total = item.units * item.pricePerUnit;
          const isOpen = expandedId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`rounded-2xl border transition-all ${isOpen ? 'border-border-accent bg-bg-elevated' : 'border-border-subtle bg-bg-card'}`}
            >
              {/* Row header */}
              <button
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                className="flex items-center w-full px-4 py-3.5 gap-3 text-left"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${total > 0 ? 'bg-success-soft' : 'bg-bg-elevated'}`}>
                  <Package size={15} className={total > 0 ? 'text-success' : 'text-text-muted'} />
                </div>
                <span className="flex-1 text-sm font-medium text-text-primary truncate">{item.material}</span>
                <span className={`text-sm font-semibold tabular-nums ${total > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                  {total > 0 ? fmt(total) : '—'}
                </span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded fields */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                      {/* Units */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <Hash size={14} className="text-text-muted" />
                          <span className="text-xs text-text-secondary font-medium">Unidades</span>
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={item.units || ''}
                          onChange={e => update(item.id, 'units', Number(e.target.value) || 0)}
                          placeholder="0"
                          className="flex-1 h-10 px-3 rounded-xl bg-bg-primary border border-border-subtle text-right text-sm font-semibold text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Price per unit */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[90px]">
                          <DollarSign size={14} className="text-text-muted" />
                          <span className="text-xs text-text-secondary font-medium">Precio/Ud</span>
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={item.pricePerUnit || ''}
                          onChange={e => update(item.id, 'pricePerUnit', Number(e.target.value) || 0)}
                          placeholder="$0"
                          className="flex-1 h-10 px-3 rounded-xl bg-bg-primary border border-border-subtle text-right text-sm font-semibold text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Subtotal + delete */}
                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <span className="text-xs text-text-secondary">Subtotal</span>
                        <span className="text-sm font-bold text-text-primary">{fmt(total)}</span>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="flex items-center justify-center gap-2 h-9 rounded-xl bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 transition-colors active:scale-[0.98]"
                      >
                        <Trash2 size={14} /> Eliminar material
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Add Material */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="p-4 rounded-2xl border border-border-accent bg-bg-elevated flex flex-col gap-3">
              <input
                ref={addInputRef}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Nombre del material..."
                autoFocus
                className="h-11 px-4 rounded-xl bg-bg-primary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setNewName(''); }} className="flex-1 h-10 rounded-xl bg-bg-card border border-border-subtle text-xs font-semibold text-text-secondary hover:bg-bg-card-hover transition-colors active:scale-[0.98]">
                  Cancelar
                </button>
                <button onClick={add} disabled={!newName.trim()} className="flex-1 h-10 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent/90 transition-all active:scale-[0.98]">
                  Agregar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAdd && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border-2 border-dashed border-border-subtle text-text-secondary text-sm font-medium hover:border-accent/40 hover:text-accent hover:bg-accent-soft transition-all active:scale-[0.98] mb-3"
        >
          <Plus size={18} /> Agregar material
        </motion.button>
      )}

      {/* Reset */}
      <AnimatePresence>
        {showReset ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-2xl border border-danger/20 bg-danger-soft flex flex-col gap-3"
          >
            <p className="text-xs text-danger font-medium text-center">¿Restaurar todos los materiales a los valores por defecto? Se perderán los cambios.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="flex-1 h-10 rounded-xl bg-bg-card border border-border-subtle text-xs font-semibold text-text-secondary active:scale-[0.98]">
                Cancelar
              </button>
              <button onClick={reset} className="flex-1 h-10 rounded-xl bg-danger text-white text-xs font-semibold active:scale-[0.98]">
                Restaurar
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-text-muted text-xs font-medium hover:text-text-secondary transition-colors"
          >
            <RotateCcw size={14} /> Restaurar por defecto
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
