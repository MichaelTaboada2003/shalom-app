'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, CalendarDays, FolderKanban, Landmark, Plus, ReceiptText, Tag, Ticket, Trash2, WalletCards, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type MovementType = 'income' | 'expense';
type TypeFilter = 'all' | MovementType;
type ActivityComponent = 'none' | 'raffles';

interface AccountingActivity { id: string; name: string; description: string; component?: ActivityComponent; createdAt: string; }
interface AccountingMovement { id: string; activityId: string | null; type: MovementType; concept: string; category: string; amount: number; date: string; note: string; }
type MovementForm = Omit<AccountingMovement, 'id' | 'amount'> & { amount: string; activityId: string };

const MOVEMENT_STORAGE_KEY = 'shalom-retiro-contabilidad';
const ACTIVITY_STORAGE_KEY = 'shalom-retiro-contabilidad-activities';
const incomeCategories = ['Inscripciones', 'Donaciones', 'Aporte de comunidad', 'Rifa o actividad', 'Otro ingreso'];
const expenseCategories = ['Hospedaje', 'Alimentación', 'Transporte', 'Materiales', 'Servicios', 'Otro gasto'];
const emptyForm: MovementForm = { activityId: '', type: 'income', concept: '', category: incomeCategories[0], amount: '', date: '', note: '' };

function readStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { const value = localStorage.getItem(key); const parsed = value ? JSON.parse(value) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function writeStorage<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }
function today() { return new Date().toISOString().slice(0, 10); }
function formatMoney(value: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }

export default function ContabilidadPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<AccountingActivity[]>([]);
  const [movements, setMovements] = useState<AccountingMovement[]>([]);
  const [ready, setReady] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [form, setForm] = useState<MovementForm>(emptyForm);
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityComponent, setActivityComponent] = useState<ActivityComponent>('none');
  const [activityPendingDeletion, setActivityPendingDeletion] = useState<AccountingActivity | null>(null);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<AccountingMovement | null>(null);

  useEffect(() => {
    const savedActivities = readStorage<AccountingActivity>(ACTIVITY_STORAGE_KEY);
    const savedMovements = readStorage<AccountingMovement>(MOVEMENT_STORAGE_KEY).map(item => ({ ...item, activityId: item.activityId ?? null }));
    // localStorage is available only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivities(savedActivities);
    setMovements(savedMovements);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { if (ready) writeStorage(ACTIVITY_STORAGE_KEY, activities); }, [activities, ready]);
  useEffect(() => { if (ready) writeStorage(MOVEMENT_STORAGE_KEY, movements); }, [movements, ready]);

  const income = useMemo(() => movements.filter(item => item.type === 'income').reduce((total, item) => total + item.amount, 0), [movements]);
  const expenses = useMemo(() => movements.filter(item => item.type === 'expense').reduce((total, item) => total + item.amount, 0), [movements]);
  const balance = income - expenses;
  const selectedActivity = activities.find(activity => activity.id === activityFilter) ?? null;
  const visibleMovements = useMemo(() => movements.filter(item => {
    const activityMatches = activityFilter === 'all' || (activityFilter === 'unassigned' ? !item.activityId : item.activityId === activityFilter);
    return activityMatches && (typeFilter === 'all' || item.type === typeFilter);
  }).sort((a, b) => b.date.localeCompare(a.date)), [activityFilter, movements, typeFilter]);

  const totalsFor = useCallback((activityId: string | null) => {
    const entries = movements.filter(item => item.activityId === activityId);
    const entryIncome = entries.filter(item => item.type === 'income').reduce((total, item) => total + item.amount, 0);
    const entryExpenses = entries.filter(item => item.type === 'expense').reduce((total, item) => total + item.amount, 0);
    return { count: entries.length, income: entryIncome, expenses: entryExpenses, balance: entryIncome - entryExpenses };
  }, [movements]);

  const openMovementForm = useCallback((type: MovementType = 'income', activityId?: string) => {
    const chosenActivity = activityId ?? (selectedActivity?.id ?? '');
    setForm({ ...emptyForm, activityId: chosenActivity, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0], date: today() });
    setShowMovementForm(true);
  }, [selectedActivity]);

  const openActivityForm = () => {
    setActivityName('');
    setActivityDescription('');
    setActivityComponent('none');
    setShowActivityForm(true);
  };

  const submitActivity = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activityName.trim()) return;
    const activity: AccountingActivity = { id: crypto.randomUUID(), name: activityName.trim(), description: activityDescription.trim(), component: activityComponent, createdAt: today() };
    setActivities(current => [activity, ...current]);
    setActivityFilter(activity.id);
    setActivityName(''); setActivityDescription(''); setActivityComponent('none'); setShowActivityForm(false);
  };

  const submitMovement = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.concept.trim() || !form.date || !Number.isFinite(amount) || amount <= 0) return;
    const movement: AccountingMovement = { id: crypto.randomUUID(), activityId: form.activityId || null, type: form.type, concept: form.concept.trim(), category: form.category, amount, date: form.date, note: form.note.trim() };
    setMovements(current => [movement, ...current]);
    setShowMovementForm(false);
  };

  const deleteMovement = () => {
    if (!entryPendingDeletion) return;
    setMovements(current => current.filter(item => item.id !== entryPendingDeletion.id));
    setEntryPendingDeletion(null);
  };

  const deleteActivity = () => {
    if (!activityPendingDeletion) return;
    setMovements(current => current.map(item => item.activityId === activityPendingDeletion.id ? { ...item, activityId: null } : item));
    setActivities(current => current.filter(activity => activity.id !== activityPendingDeletion.id));
    if (activityFilter === activityPendingDeletion.id) setActivityFilter('all');
    setActivityPendingDeletion(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-5 pt-4">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button onClick={() => router.push('/retiro')} className="icon-button" aria-label="Volver a retiro"><ArrowLeft size={18} /></button><div><h1 className="text-xl font-bold tracking-tight">Contabilidad</h1><p className="mt-1 text-xs text-text-muted">Actividades, movimientos y balance del retiro</p></div></div><button onClick={() => openMovementForm()} className="primary-button shrink-0"><Plus size={16} /> Registrar</button></motion.header>

      <motion.section initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .05 }} className="relative overflow-hidden rounded-3xl border border-border-accent bg-gradient-to-br from-accent/20 via-bg-card to-success/10 p-5 shadow-[0_20px_48px_rgba(5,3,15,.2)]"><div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" /><div className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-success/10 blur-3xl" /><div className="relative flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[.15em] text-accent">Balance disponible</span><strong className={`mt-2 block text-3xl tracking-tight ${balance < 0 ? 'text-danger' : 'text-text-primary'}`}>{formatMoney(balance)}</strong><p className="mt-2 text-xs text-text-secondary">{activities.length ? `${activities.length} actividades y ${movements.length} movimientos` : 'Crea una actividad para agrupar sus movimientos.'}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-bg-primary/35 text-accent"><WalletCards size={22} /></span></div><div className="relative mt-5 grid grid-cols-2 gap-2"><button onClick={() => openMovementForm('income')} className="rounded-2xl border border-success/20 bg-success-soft/55 p-3 text-left transition-colors hover:bg-success-soft"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em] text-success"><ArrowUpRight size={14} /> Ingresos</span><b className="mt-1 block text-base tabular-nums text-text-primary">{formatMoney(income)}</b></button><button onClick={() => openMovementForm('expense')} className="rounded-2xl border border-danger/20 bg-danger-soft/45 p-3 text-left transition-colors hover:bg-danger-soft"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em] text-danger"><ArrowDownRight size={14} /> Gastos</span><b className="mt-1 block text-base tabular-nums text-text-primary">{formatMoney(expenses)}</b></button></div></motion.section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Actividades</h2>
            <p className="mt-0.5 text-xs text-text-muted">Cada actividad reúne tantos movimientos como necesites.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedActivity && <button onClick={() => setActivityPendingDeletion(selectedActivity)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft px-3 text-xs font-bold text-danger transition-colors hover:bg-danger/20"><Trash2 size={14} /> Eliminar</button>}
            <button onClick={openActivityForm} className="secondary-button min-h-9 px-3 text-xs"><Plus size={15} /> Nueva</button>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setActivityFilter('all')} className={`min-w-40 rounded-2xl border p-3 text-left transition-colors ${activityFilter === 'all' ? 'border-accent bg-accent-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}><span className="flex items-center gap-2 text-xs font-black text-text-primary"><Landmark size={15} className="text-accent" /> Todo el retiro</span><small className="mt-2 block text-[10px] font-bold text-text-muted">{movements.length} movimientos · {formatMoney(balance)}</small></button>
          {activities.map(activity => {
            const totals = totalsFor(activity.id);
            return <button key={activity.id} onClick={() => setActivityFilter(activity.id)} className={`min-w-48 rounded-2xl border p-3 text-left transition-colors ${activityFilter === activity.id ? 'border-success bg-success-soft/50' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}><span className="flex items-center gap-2 text-xs font-black text-text-primary">{activity.component === 'raffles' ? <Ticket size={15} className="text-warning" /> : <FolderKanban size={15} className="text-success" />}<span className="truncate">{activity.name}</span></span><small className="mt-1 block max-w-44 truncate text-[10px] font-bold text-text-muted">{activity.component === 'raffles' ? 'Componente: Rifas' : activity.description || 'Actividad sin descripción'}</small><b className={`mt-2 block text-xs tabular-nums ${totals.balance < 0 ? 'text-danger' : 'text-success'}`}>{formatMoney(totals.balance)} · {totals.count} mov.</b></button>;
          })}
          {movements.some(item => !item.activityId) && <button onClick={() => setActivityFilter('unassigned')} className={`min-w-40 rounded-2xl border p-3 text-left transition-colors ${activityFilter === 'unassigned' ? 'border-warning bg-warning-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}><span className="text-xs font-black text-text-primary">Sin actividad</span><small className="mt-2 block text-[10px] font-bold text-text-muted">{totalsFor(null).count} movimientos previos</small></button>}
        </div>
      </section>

      {selectedActivity?.component === 'raffles' && <section className="mt-4 rounded-3xl border border-warning/25 bg-gradient-to-r from-warning-soft to-accent-soft/45 p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warning"><Ticket size={19} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold">Componente de Rifas</h2><p className="mt-1 text-xs leading-5 text-text-secondary">Gestiona aquí las campañas, boletas, vendedores y recaudo de {selectedActivity.name}.</p></div><button onClick={() => router.push('/retiro/rifas')} className="secondary-button shrink-0 px-3 text-xs">Abrir</button></div></section>}

      <section className="mt-6"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">{selectedActivity ? selectedActivity.name : activityFilter === 'unassigned' ? 'Sin actividad' : 'Movimientos del retiro'}</h2><p className="mt-0.5 text-xs text-text-muted">{selectedActivity?.description || 'Registra ingresos y gastos dentro de la actividad elegida.'}</p></div><div className="flex rounded-xl border border-border-subtle bg-bg-card p-1">{([{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Gastos' }] as const).map(option => <button key={option.id} onClick={() => setTypeFilter(option.id)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-colors ${typeFilter === option.id ? 'bg-accent-soft text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>{option.label}</button>)}</div></div>
        {visibleMovements.length === 0 ? <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-border-medium bg-bg-card/45 p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent"><FolderKanban size={21} /></span><h3 className="mt-3 text-base font-bold">Aún no hay movimientos aquí</h3><p className="mx-auto mt-1 max-w-64 text-xs leading-5 text-text-secondary">{selectedActivity ? `Registra el primer movimiento de ${selectedActivity.name}.` : 'Elige o crea una actividad para organizar sus movimientos.'}</p><button onClick={() => openMovementForm()} className="primary-button mt-4"><Plus size={16} /> Registrar movimiento</button></div></div> : <div className="flex flex-col gap-2">{visibleMovements.map((movement, index) => { const activity = activities.find(item => item.id === movement.activityId); return <motion.article key={movement.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .035 }} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-card p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${movement.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{movement.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><b className="truncate text-sm text-text-primary">{movement.concept}</b><strong className={`shrink-0 text-sm tabular-nums ${movement.type === 'income' ? 'text-success' : 'text-danger'}`}>{movement.type === 'income' ? '+' : '-'}{formatMoney(movement.amount)}</strong></div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-text-muted"><span className="inline-flex items-center gap-1"><Tag size={11} />{movement.category}</span><span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatDate(movement.date)}</span>{activity && <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-success">{activity.name}</span>}{movement.note && <span className="max-w-36 truncate">{movement.note}</span>}</div></div><button onClick={() => setEntryPendingDeletion(movement)} className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar ${movement.concept}`}><Trash2 size={16} /></button></motion.article>; })}</div>}
      </section>

      <AnimatePresence>{showActivityForm && <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.form onSubmit={submitActivity} className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-bg-secondary shadow-2xl" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}><header className="flex items-center justify-between bg-gradient-to-r from-success/20 to-accent/10 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-success">Contabilidad</p><h2 className="mt-1 text-lg font-bold">Nueva actividad</h2></div><button type="button" onClick={() => setShowActivityForm(false)} className="icon-button" aria-label="Cerrar"><X size={17} /></button></header><div className="flex flex-col gap-4 p-5"><label className="form-label">Nombre de la actividad<input autoFocus required value={activityName} onChange={event => setActivityName(event.target.value)} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-4 text-sm text-text-primary outline-none focus:border-accent" placeholder="Ej. Rifa de apoyo" /></label><label className="form-label">Descripción <span className="text-text-muted">(opcional)</span><textarea value={activityDescription} onChange={event => setActivityDescription(event.target.value)} className="min-h-24 rounded-2xl border border-border-subtle bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent" placeholder="Objetivo o detalle de la actividad" /></label><fieldset><legend className="form-label mb-2">Componente de la actividad</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setActivityComponent('none')} className={`rounded-2xl border p-3 text-left transition-colors ${activityComponent === 'none' ? 'border-accent bg-accent-soft' : 'border-border-subtle bg-bg-card'}`}><FolderKanban size={17} className="text-accent" /><b className="mt-2 block text-xs">Sin componente</b><span className="mt-1 block text-[10px] leading-4 text-text-muted">Solo movimientos contables.</span></button><button type="button" onClick={() => setActivityComponent('raffles')} className={`rounded-2xl border p-3 text-left transition-colors ${activityComponent === 'raffles' ? 'border-warning bg-warning-soft' : 'border-border-subtle bg-bg-card'}`}><Ticket size={17} className="text-warning" /><b className="mt-2 block text-xs">Rifas</b><span className="mt-1 block text-[10px] leading-4 text-text-muted">Campañas, boletas y vendedores.</span></button></div></fieldset></div><footer className="flex gap-2 border-t border-border-subtle bg-bg-primary/35 p-4"><button type="button" onClick={() => setShowActivityForm(false)} className="secondary-button flex-1">Cancelar</button><button className="primary-button flex-1"><FolderKanban size={16} /> Crear actividad</button></footer></motion.form></motion.div>}</AnimatePresence>
      <AnimatePresence>{showMovementForm && <motion.div className="fixed inset-0 z-[81] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.form onSubmit={submitMovement} className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-bg-secondary shadow-2xl" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}><header className="flex items-center justify-between bg-gradient-to-r from-accent/20 to-success/10 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-accent">{form.activityId ? activities.find(item => item.id === form.activityId)?.name || 'Actividad' : 'Contabilidad general'}</p><h2 className="mt-1 text-lg font-bold">Nuevo movimiento</h2></div><button type="button" onClick={() => setShowMovementForm(false)} className="icon-button" aria-label="Cerrar"><X size={17} /></button></header><div className="flex flex-col gap-4 p-5"><label className="form-label">Actividad<select value={form.activityId} onChange={event => setForm(current => ({ ...current, activityId: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent"><option value="">Sin actividad</option>{activities.map(activity => <option key={activity.id} value={activity.id}>{activity.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm(current => ({ ...current, type: 'income', category: incomeCategories[0] }))} className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border p-3 text-left ${form.type === 'income' ? 'border-success bg-success-soft text-success' : 'border-border-subtle bg-bg-card text-text-muted'}`}><ArrowUpRight size={17} /><b className="mt-1 text-xs">Ingreso</b></button><button type="button" onClick={() => setForm(current => ({ ...current, type: 'expense', category: expenseCategories[0] }))} className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border p-3 text-left ${form.type === 'expense' ? 'border-danger bg-danger-soft text-danger' : 'border-border-subtle bg-bg-card text-text-muted'}`}><ArrowDownRight size={17} /><b className="mt-1 text-xs">Gasto</b></button></div><label className="form-label">Concepto<input autoFocus required value={form.concept} onChange={event => setForm(current => ({ ...current, concept: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-4 text-sm text-text-primary outline-none focus:border-accent" placeholder="Ej. Venta de boletas" /></label><div className="grid grid-cols-2 gap-3"><label className="form-label">Categoría<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent">{(form.type === 'income' ? incomeCategories : expenseCategories).map(category => <option key={category}>{category}</option>)}</select></label><label className="form-label">Monto<input required type="number" min="1" inputMode="numeric" value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent" placeholder="$0" /></label></div><label className="form-label">Fecha<input required type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} className="h-12 rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent" /></label><label className="form-label">Nota <span className="text-text-muted">(opcional)</span><textarea value={form.note} onChange={event => setForm(current => ({ ...current, note: event.target.value }))} className="min-h-20 rounded-2xl border border-border-subtle bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent" placeholder="Referencia, responsable o detalle" /></label></div><footer className="flex gap-2 border-t border-border-subtle bg-bg-primary/35 p-4"><button type="button" onClick={() => setShowMovementForm(false)} className="secondary-button flex-1">Cancelar</button><button className="primary-button flex-1"><ReceiptText size={16} /> Guardar</button></footer></motion.form></motion.div>}</AnimatePresence>
      <AnimatePresence>{entryPendingDeletion && <motion.div className="fixed inset-0 z-[82] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-movement-title" className="w-full max-w-sm rounded-3xl border border-danger/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><Trash2 size={19} /></span><h2 id="delete-movement-title" className="mt-4 text-lg font-bold">¿Eliminar movimiento?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se eliminará <b className="text-text-primary">{entryPendingDeletion.concept}</b> del registro contable.</p><div className="mt-5 flex gap-2"><button onClick={() => setEntryPendingDeletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={deleteMovement} className="danger-button flex-1">Eliminar</button></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{activityPendingDeletion && <motion.div className="fixed inset-0 z-[83] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-activity-title" className="w-full max-w-sm rounded-3xl border border-danger/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><Trash2 size={19} /></span><h2 id="delete-activity-title" className="mt-4 text-lg font-bold">¿Eliminar actividad?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se eliminará <b className="text-text-primary">{activityPendingDeletion.name}</b>. Sus {totalsFor(activityPendingDeletion.id).count} movimientos se conservarán en <b className="text-text-primary">Sin actividad</b>.</p><div className="mt-5 flex gap-2"><button onClick={() => setActivityPendingDeletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={deleteActivity} className="danger-button flex-1">Eliminar</button></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
