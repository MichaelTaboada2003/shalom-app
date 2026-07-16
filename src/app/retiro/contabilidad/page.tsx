'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, CalendarDays, Landmark, Plus, ReceiptText, Tag, Trash2, WalletCards, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type MovementType = 'income' | 'expense';
type Filter = 'all' | MovementType;

interface AccountingMovement {
  id: string;
  type: MovementType;
  concept: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

type MovementForm = Omit<AccountingMovement, 'id' | 'amount'> & { amount: string };

const STORAGE_KEY = 'shalom-retiro-contabilidad';
const incomeCategories = ['Inscripciones', 'Donaciones', 'Aporte de comunidad', 'Rifa o actividad', 'Otro ingreso'];
const expenseCategories = ['Hospedaje', 'Alimentación', 'Transporte', 'Materiales', 'Servicios', 'Otro gasto'];
const emptyForm: MovementForm = { type: 'income', concept: '', category: incomeCategories[0], amount: '', date: '', note: '' };

function loadMovements(): AccountingMovement[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMovements(movements: AccountingMovement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export default function ContabilidadPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<AccountingMovement[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MovementForm>(emptyForm);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<AccountingMovement | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // localStorage is available only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMovements(loadMovements());
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) { hasLoaded.current = true; return; }
    saveMovements(movements);
  }, [movements]);

  const income = useMemo(() => movements.filter(item => item.type === 'income').reduce((total, item) => total + item.amount, 0), [movements]);
  const expenses = useMemo(() => movements.filter(item => item.type === 'expense').reduce((total, item) => total + item.amount, 0), [movements]);
  const balance = income - expenses;
  const visibleMovements = useMemo(() => movements.filter(item => filter === 'all' || item.type === filter).sort((a, b) => b.date.localeCompare(a.date)), [filter, movements]);

  const openMovementForm = useCallback((type: MovementType = 'income') => {
    setForm({ ...emptyForm, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0], date: today() });
    setShowForm(true);
  }, []);

  const updateType = (type: MovementType) => setForm(current => ({ ...current, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0] }));

  const submitMovement = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.concept.trim() || !form.date || !Number.isFinite(amount) || amount <= 0) return;
    const movement: AccountingMovement = { id: crypto.randomUUID(), type: form.type, concept: form.concept.trim(), category: form.category, amount, date: form.date, note: form.note.trim() };
    setMovements(current => [movement, ...current]);
    setShowForm(false);
  };

  const deleteMovement = () => {
    if (!entryPendingDeletion) return;
    setMovements(current => current.filter(item => item.id !== entryPendingDeletion.id));
    setEntryPendingDeletion(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-5 pt-4">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/retiro')} className="icon-button" aria-label="Volver a retiro"><ArrowLeft size={18} /></button><div><h1 className="text-xl font-bold tracking-tight">Contabilidad</h1><p className="mt-1 text-xs text-text-muted">Movimientos y balance del retiro</p></div></div>
        <button onClick={() => openMovementForm()} className="primary-button shrink-0"><Plus size={16} /> Registrar</button>
      </motion.header>

      <motion.section initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .05 }} className="relative overflow-hidden rounded-3xl border border-border-accent bg-gradient-to-br from-accent/20 via-bg-card to-success/10 p-5 shadow-[0_20px_48px_rgba(5,3,15,.2)]">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" /><div className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-success/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[.15em] text-accent">Balance disponible</span><strong className={`mt-2 block text-3xl tracking-tight ${balance < 0 ? 'text-danger' : 'text-text-primary'}`}>{formatMoney(balance)}</strong><p className="mt-2 text-xs text-text-secondary">{movements.length ? `${movements.length} movimientos registrados` : 'Registra el primer movimiento del retiro.'}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-bg-primary/35 text-accent"><WalletCards size={22} /></span></div>
        <div className="relative mt-5 grid grid-cols-2 gap-2"><button onClick={() => openMovementForm('income')} className="rounded-2xl border border-success/20 bg-success-soft/55 p-3 text-left transition-colors hover:bg-success-soft"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em] text-success"><ArrowUpRight size={14} /> Ingresos</span><b className="mt-1 block text-base tabular-nums text-text-primary">{formatMoney(income)}</b></button><button onClick={() => openMovementForm('expense')} className="rounded-2xl border border-danger/20 bg-danger-soft/45 p-3 text-left transition-colors hover:bg-danger-soft"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em] text-danger"><ArrowDownRight size={14} /> Gastos</span><b className="mt-1 block text-base tabular-nums text-text-primary">{formatMoney(expenses)}</b></button></div>
      </motion.section>

      <section className="mt-6"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold">Movimientos</h2><p className="mt-0.5 text-xs text-text-muted">Cada ingreso y gasto queda visible aquí.</p></div><div className="flex rounded-xl border border-border-subtle bg-bg-card p-1">{([{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Gastos' }] as const).map(option => <button key={option.id} onClick={() => setFilter(option.id)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-colors ${filter === option.id ? 'bg-accent-soft text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>{option.label}</button>)}</div></div>
        {visibleMovements.length === 0 ? <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-border-medium bg-bg-card/45 p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Landmark size={21} /></span><h3 className="mt-3 text-base font-bold">Aún no hay movimientos</h3><p className="mx-auto mt-1 max-w-64 text-xs leading-5 text-text-secondary">Registra ingresos por inscripciones o gastos del retiro para ver el balance.</p><button onClick={() => openMovementForm()} className="primary-button mt-4"><Plus size={16} /> Registrar movimiento</button></div></div> : <div className="flex flex-col gap-2">{visibleMovements.map((movement, index) => <motion.article key={movement.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .035 }} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-card p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${movement.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{movement.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><b className="truncate text-sm text-text-primary">{movement.concept}</b><strong className={`shrink-0 text-sm tabular-nums ${movement.type === 'income' ? 'text-success' : 'text-danger'}`}>{movement.type === 'income' ? '+' : '-'}{formatMoney(movement.amount)}</strong></div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-text-muted"><span className="inline-flex items-center gap-1"><Tag size={11} />{movement.category}</span><span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatDate(movement.date)}</span>{movement.note && <span className="max-w-44 truncate">{movement.note}</span>}</div></div><button onClick={() => setEntryPendingDeletion(movement)} className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar ${movement.concept}`}><Trash2 size={16} /></button></motion.article>)}</div>}
      </section>

      <AnimatePresence>{showForm && <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.form onSubmit={submitMovement} className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-bg-secondary shadow-2xl" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}><header className="flex items-center justify-between bg-gradient-to-r from-accent/20 to-success/10 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-accent">Contabilidad</p><h2 className="mt-1 text-lg font-bold">Nuevo movimiento</h2></div><button type="button" onClick={() => setShowForm(false)} className="icon-button" aria-label="Cerrar"><X size={17} /></button></header><div className="flex flex-col gap-4 p-5"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => updateType('income')} className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border p-3 text-left ${form.type === 'income' ? 'border-success bg-success-soft text-success' : 'border-border-subtle bg-bg-card text-text-muted'}`}><ArrowUpRight size={17} /><b className="mt-1 text-xs">Ingreso</b></button><button type="button" onClick={() => updateType('expense')} className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border p-3 text-left ${form.type === 'expense' ? 'border-danger bg-danger-soft text-danger' : 'border-border-subtle bg-bg-card text-text-muted'}`}><ArrowDownRight size={17} /><b className="mt-1 text-xs">Gasto</b></button></div><label className="form-label">Concepto<input autoFocus required value={form.concept} onChange={event => setForm(current => ({ ...current, concept: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-4 text-sm text-text-primary outline-none focus:border-accent" placeholder="Ej. Aportes de inscripciones" /></label><div className="grid grid-cols-2 gap-3"><label className="form-label">Categoría<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent">{(form.type === 'income' ? incomeCategories : expenseCategories).map(category => <option key={category}>{category}</option>)}</select></label><label className="form-label">Monto<input required type="number" min="1" inputMode="numeric" value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent" placeholder="$0" /></label></div><label className="form-label">Fecha<input required type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent" /></label><label className="form-label">Nota <span className="text-text-muted">(opcional)</span><textarea value={form.note} onChange={event => setForm(current => ({ ...current, note: event.target.value }))} className="min-h-20 rounded-2xl border border-border-subtle bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent" placeholder="Referencia, responsable o detalle" /></label></div><footer className="flex gap-2 border-t border-border-subtle bg-bg-primary/35 p-4"><button type="button" onClick={() => setShowForm(false)} className="secondary-button flex-1">Cancelar</button><button className="primary-button flex-1"><ReceiptText size={16} /> Guardar</button></footer></motion.form></motion.div>}</AnimatePresence>
      <AnimatePresence>{entryPendingDeletion && <motion.div className="fixed inset-0 z-[82] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-movement-title" className="w-full max-w-sm rounded-3xl border border-danger/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><Trash2 size={19} /></span><h2 id="delete-movement-title" className="mt-4 text-lg font-bold">¿Eliminar movimiento?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se eliminará <b className="text-text-primary">{entryPendingDeletion.concept}</b> del registro contable.</p><div className="mt-5 flex gap-2"><button onClick={() => setEntryPendingDeletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={deleteMovement} className="danger-button flex-1">Eliminar</button></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
