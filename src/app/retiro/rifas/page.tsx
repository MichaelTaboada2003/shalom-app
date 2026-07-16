'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, CheckCircle2, Pencil, Plus, Ticket, Trash2, UserRoundPlus, Users, X } from 'lucide-react';

interface Raffle {
  id: string;
  activityId?: string;
  status?: 'active' | 'archived';
  completedAt?: string;
  settlementMovementId?: string;
  name: string;
  prize: string;
  goal: number;
  ticketPrice: number;
  ticketCount: number;
  drawDate: string;
  createdAt: string;
}

interface RaffleSeller {
  id: string;
  raffleId: string;
  name: string;
  phone: string;
}

interface RaffleSale {
  id: string;
  raffleId: string;
  sellerId: string;
  tickets: number;
  date: string;
}

interface SettlementMovement {
  id: string;
  activityId: null;
  type: 'income';
  concept: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

const RAFFLES_KEY = 'shalom-retiro-raffles';
const SELLERS_KEY = 'shalom-retiro-raffle-sellers';
const SALES_KEY = 'shalom-retiro-raffle-sales';
const MOVEMENTS_KEY = 'shalom-retiro-contabilidad';

const emptyRaffle = { name: '', prize: '', goal: '', ticketPrice: '', ticketCount: '', drawDate: '' };
const emptySeller = { name: '', phone: '' };
const emptySale = { sellerId: '', tickets: '', date: '' };

function readStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function persistRetreat(scope: string, data: unknown[]) { return fetch('/api/retreat', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope, data }) }); }

function money(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

function today() { return new Date().toISOString().slice(0, 10); }

export default function RifasPage({ embedded = false, activityId, activityName, onSettlement }: { embedded?: boolean; activityId?: string; activityName?: string; onSettlement?: (movement: SettlementMovement) => void }) {
  const [ready, setReady] = useState(false);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [sellers, setSellers] = useState<RaffleSeller[]>([]);
  const [sales, setSales] = useState<RaffleSale[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRaffleForm, setShowRaffleForm] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [raffleForm, setRaffleForm] = useState(emptyRaffle);
  const [sellerForm, setSellerForm] = useState(emptySeller);
  const [saleForm, setSaleForm] = useState(emptySale);
  const [rafflePendingDeletion, setRafflePendingDeletion] = useState<Raffle | null>(null);
  const [saleBeingEdited, setSaleBeingEdited] = useState<RaffleSale | null>(null);
  const [salePendingDeletion, setSalePendingDeletion] = useState<RaffleSale | null>(null);
  const [rafflePendingCompletion, setRafflePendingCompletion] = useState<Raffle | null>(null);

  useEffect(() => {
    let active = true;
    const legacyRaffles = readStorage<Raffle>(RAFFLES_KEY);
    const legacySellers = readStorage<RaffleSeller>(SELLERS_KEY);
    const legacySales = readStorage<RaffleSale>(SALES_KEY);
    fetch('/api/retreat', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('No se pudo cargar Rifas');
      return response.json();
    }).then(data => {
      if (!active) return;
      setRaffles(data.raffles.length || !legacyRaffles.length ? data.raffles : legacyRaffles);
      setSellers(data.sellers.length || !legacySellers.length ? data.sellers : legacySellers);
      setSales(data.sales.length || !legacySales.length ? data.sales : legacySales);
    }).catch(() => { if (active) { setRaffles(legacyRaffles); setSellers(legacySellers); setSales(legacySales); } }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (ready) void persistRetreat('raffles', raffles); }, [raffles, ready]);
  useEffect(() => { if (ready) void persistRetreat('sellers', sellers); }, [sellers, ready]);
  useEffect(() => { if (ready) void persistRetreat('sales', sales); }, [sales, ready]);

  const activityRaffles = activityId ? raffles.filter(raffle => raffle.activityId === activityId) : raffles;
  const activeRaffles = activityRaffles.filter(raffle => raffle.status !== 'archived');
  const archivedRaffles = activityRaffles.filter(raffle => raffle.status === 'archived');
  const selectedRaffle = activityRaffles.find(raffle => raffle.id === selectedId) ?? null;
  const statsFor = (raffleId: string) => {
    const raffleSales = sales.filter(sale => sale.raffleId === raffleId);
    const ticketsSold = raffleSales.reduce((sum, sale) => sum + sale.tickets, 0);
    const raffle = raffles.find(item => item.id === raffleId);
    const raised = raffle ? ticketsSold * raffle.ticketPrice : 0;
    return { ticketsSold, raised, sellers: sellers.filter(seller => seller.raffleId === raffleId).length };
  };

  const totals = useMemo(() => {
    const raised = activeRaffles.reduce((sum, raffle) => sum + statsFor(raffle.id).raised, 0);
    const goal = activeRaffles.reduce((sum, raffle) => sum + raffle.goal, 0);
    const sellerCount = sellers.filter(seller => activeRaffles.some(raffle => raffle.id === seller.raffleId)).length;
    return { raised, goal, sellers: sellerCount };
  // statsFor intentionally reads current state to keep aggregate cards in sync.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, raffles, sellers, sales]);

  const createRaffle = (event: React.FormEvent) => {
    event.preventDefault();
    const goal = Number(raffleForm.goal);
    const ticketPrice = Number(raffleForm.ticketPrice);
    const ticketCount = Number(raffleForm.ticketCount);
    if (!raffleForm.name.trim() || !Number.isFinite(goal) || goal <= 0 || !Number.isFinite(ticketPrice) || ticketPrice <= 0 || !Number.isInteger(ticketCount) || ticketCount <= 0) return;
    const raffle: Raffle = { id: crypto.randomUUID(), activityId, name: raffleForm.name.trim(), prize: raffleForm.prize.trim(), goal, ticketPrice, ticketCount, drawDate: raffleForm.drawDate, createdAt: today() };
    setRaffles(current => [raffle, ...current]);
    setSelectedId(raffle.id);
    setRaffleForm(emptyRaffle);
    setShowRaffleForm(false);
  };

  const createSeller = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRaffle || !sellerForm.name.trim()) return;
    setSellers(current => [{ id: crypto.randomUUID(), raffleId: selectedRaffle.id, name: sellerForm.name.trim(), phone: sellerForm.phone.trim() }, ...current]);
    setSellerForm(emptySeller);
    setShowSellerForm(false);
  };

  const closeSaleForm = () => {
    setShowSaleForm(false);
    setSaleBeingEdited(null);
    setSaleForm(emptySale);
  };

  const openSaleForm = (sale?: RaffleSale) => {
    if (sale) {
      setSaleBeingEdited(sale);
      setSaleForm({ sellerId: sale.sellerId, tickets: String(sale.tickets), date: sale.date });
    } else {
      setSaleBeingEdited(null);
      setSaleForm({ sellerId: selectedSellers[0]?.id || '', tickets: '', date: today() });
    }
    setShowSaleForm(true);
  };

  const saveSale = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRaffle || !saleForm.sellerId) return;
    const tickets = Number(saleForm.tickets);
    const { ticketsSold } = statsFor(selectedRaffle.id);
    const availableTickets = selectedRaffle.ticketCount - ticketsSold + (saleBeingEdited?.tickets || 0);
    if (!Number.isInteger(tickets) || tickets <= 0 || tickets > availableTickets) return;
    if (saleBeingEdited) {
      setSales(current => current.map(sale => sale.id === saleBeingEdited.id ? { ...sale, sellerId: saleForm.sellerId, tickets, date: saleForm.date || today() } : sale));
    } else {
      setSales(current => [{ id: crypto.randomUUID(), raffleId: selectedRaffle.id, sellerId: saleForm.sellerId, tickets, date: saleForm.date || today() }, ...current]);
    }
    closeSaleForm();
  };

  const deleteRaffle = () => {
    if (!rafflePendingDeletion) return;
    setRaffles(current => current.filter(raffle => raffle.id !== rafflePendingDeletion.id));
    setSellers(current => current.filter(seller => seller.raffleId !== rafflePendingDeletion.id));
    setSales(current => current.filter(sale => sale.raffleId !== rafflePendingDeletion.id));
    if (selectedId === rafflePendingDeletion.id) setSelectedId(null);
    setRafflePendingDeletion(null);
  };

  const deleteSale = () => {
    if (!salePendingDeletion) return;
    setSales(current => current.filter(sale => sale.id !== salePendingDeletion.id));
    setSalePendingDeletion(null);
  };

  const concludeRaffle = () => {
    if (!rafflePendingCompletion) return;
    const settlement = statsFor(rafflePendingCompletion.id).raised;
    if (settlement <= 0) return;
    const movement: SettlementMovement = { id: crypto.randomUUID(), activityId: null, type: 'income', concept: `Rifa concluida: ${rafflePendingCompletion.name}`, category: 'Rifa o actividad', amount: settlement, date: today(), note: `Recaudo final de ${statsFor(rafflePendingCompletion.id).ticketsSold} boletas.` };
    if (onSettlement) onSettlement(movement);
    else void persistRetreat('movements', [movement, ...readStorage<SettlementMovement>(MOVEMENTS_KEY)]);
    setRaffles(current => current.map(raffle => raffle.id === rafflePendingCompletion.id ? { ...raffle, status: 'archived', completedAt: today(), settlementMovementId: movement.id } : raffle));
    if (selectedId === rafflePendingCompletion.id) setSelectedId(null);
    setRafflePendingCompletion(null);
  };

  const selectedSellers = selectedRaffle ? sellers.filter(seller => seller.raffleId === selectedRaffle.id) : [];
  const selectedSales = selectedRaffle ? sales.filter(sale => sale.raffleId === selectedRaffle.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const selectedStats = selectedRaffle ? statsFor(selectedRaffle.id) : null;
  const progress = selectedRaffle && selectedStats ? Math.min(100, Math.round((selectedStats.raised / selectedRaffle.goal) * 100)) : 0;
  const isArchived = selectedRaffle?.status === 'archived';

  return (
    <div className={embedded ? 'pt-5' : 'mx-auto max-w-3xl px-4 pb-7 pt-4'}>
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center justify-between gap-3">
        <div><h1 className={`${embedded ? 'text-lg' : 'text-xl'} font-bold tracking-tight`}>{embedded ? `Rifas de ${activityName}` : 'Rifas'}</h1><p className="mt-1 text-xs text-text-muted">Metas, boletas y vendedores en un solo lugar</p></div>
        <button onClick={() => setShowRaffleForm(true)} className="primary-button shrink-0"><Plus size={16} /> Nueva</button>
      </motion.header>

      <motion.section initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-border-accent bg-gradient-to-br from-warning/15 via-bg-card to-accent/10 p-5 shadow-[0_20px_48px_rgba(5,3,15,.2)]">
        <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[.15em] text-warning">Recaudo de rifas</span><strong className="mt-2 block text-3xl tracking-tight text-text-primary">{money(totals.raised)}</strong><p className="mt-2 text-xs text-text-secondary">Meta conjunta: {money(totals.goal)} · {totals.sellers} vendedores</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-bg-primary/35 text-warning"><Ticket size={22} /></span></div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-bg-primary/60"><div className="h-full rounded-full bg-gradient-to-r from-warning to-accent transition-all" style={{ width: `${totals.goal ? Math.min(100, (totals.raised / totals.goal) * 100) : 0}%` }} /></div>
      </motion.section>

      <section className="mt-6">
        {activeRaffles.length === 0 ? <div className="rounded-3xl border border-dashed border-border-medium bg-bg-card/45 p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warning-soft text-warning"><Ticket size={21} /></span><h2 className="mt-3 text-base font-bold">No hay rifas activas</h2><p className="mx-auto mt-1 max-w-64 text-xs leading-5 text-text-secondary">Crea una campaña para registrar sus boletas, vendedores y recaudo.</p><button onClick={() => setShowRaffleForm(true)} className="primary-button mt-4"><Plus size={16} /> Crear rifa</button></div> : <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{activeRaffles.map(raffle => { const stats = statsFor(raffle.id); const isSelected = raffle.id === selectedId; return <button key={raffle.id} onClick={() => setSelectedId(raffle.id)} className={`min-w-56 rounded-2xl border p-3 text-left transition-colors ${isSelected ? 'border-warning bg-warning-soft/55' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}><span className="flex items-center gap-2 text-xs font-black text-text-primary"><Ticket size={15} className="text-warning" /><span className="truncate">{raffle.name}</span></span><b className="mt-3 block text-xs tabular-nums text-success">{money(stats.raised)} · {stats.ticketsSold}/{raffle.ticketCount} boletas</b></button>; })}</div>}
      </section>

      {archivedRaffles.length > 0 && <section className="mt-5"><div className="mb-2 flex items-center gap-2"><Archive size={15} className="text-text-muted" /><h2 className="text-sm font-bold">Historial de rifas</h2></div><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{archivedRaffles.map(raffle => { const stats = statsFor(raffle.id); return <button key={raffle.id} onClick={() => setSelectedId(raffle.id)} className={`min-w-52 rounded-2xl border p-3 text-left transition-colors ${raffle.id === selectedId ? 'border-border-medium bg-bg-elevated' : 'border-border-subtle bg-bg-card/65 hover:border-border-medium'}`}><span className="flex items-center gap-2 text-xs font-black text-text-primary"><Archive size={14} className="text-text-muted" /><span className="truncate">{raffle.name}</span></span><b className="mt-3 block text-xs tabular-nums text-text-secondary">{money(stats.raised)} · concluida</b></button>; })}</div></section>}

      {selectedRaffle && selectedStats && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="rounded-3xl border border-border-subtle bg-bg-card p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[.14em] text-warning">{isArchived ? 'Rifa concluida' : 'Rifa seleccionada'}</span><h2 className="mt-1 truncate text-lg font-bold">{selectedRaffle.name}</h2><p className="mt-1 text-xs text-text-secondary">{selectedRaffle.prize || 'Premio por definir'}{selectedRaffle.drawDate && ` · Sorteo ${new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${selectedRaffle.drawDate}T00:00:00Z`))}`}</p>{isArchived && <p className="mt-2 text-[10px] font-bold text-text-muted">Archivada el {new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${selectedRaffle.completedAt}T00:00:00Z`))}</p>}</div><div className="flex shrink-0 items-center gap-1">{!isArchived && <button disabled={selectedStats.raised <= 0} onClick={() => setRafflePendingCompletion(selectedRaffle)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-success/25 bg-success-soft px-2.5 text-[10px] font-black text-success transition-colors hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-45"><CheckCircle2 size={14} /> Concluir</button>}{!isArchived && <button onClick={() => setRafflePendingDeletion(selectedRaffle)} className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar ${selectedRaffle.name}`}><Trash2 size={16} /></button>}</div></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-success-soft/55 p-3"><span className="block text-[10px] font-black uppercase tracking-wide text-success">Recaudo</span><b className="mt-1 block text-sm tabular-nums">{money(selectedStats.raised)}</b></div><div className="rounded-2xl bg-accent-soft p-3"><span className="block text-[10px] font-black uppercase tracking-wide text-accent">Boletas</span><b className="mt-1 block text-sm tabular-nums">{selectedStats.ticketsSold}/{selectedRaffle.ticketCount}</b></div><div className="rounded-2xl bg-warning-soft p-3"><span className="block text-[10px] font-black uppercase tracking-wide text-warning">Meta</span><b className="mt-1 block text-sm tabular-nums">{progress}%</b></div></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg-primary"><div className="h-full rounded-full bg-gradient-to-r from-warning to-success transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs text-text-muted">Cada boleta vale {money(selectedRaffle.ticketPrice)} · quedan {Math.max(0, selectedRaffle.ticketCount - selectedStats.ticketsSold)} disponibles.</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Vendedores</h2><p className="mt-0.5 text-xs text-text-muted">Personas responsables de ofrecer las boletas.</p></div>{!isArchived && <button onClick={() => setShowSellerForm(true)} className="secondary-button min-h-9 px-3 text-xs"><UserRoundPlus size={15} /> Agregar</button>}</div>
        {selectedSellers.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-border-medium bg-bg-card/45 p-5 text-center text-xs text-text-secondary">Agrega vendedores para registrar sus ventas.</div> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{selectedSellers.map(seller => { const sold = selectedSales.filter(sale => sale.sellerId === seller.id).reduce((sum, sale) => sum + sale.tickets, 0); return <article key={seller.id} className="rounded-2xl border border-border-subtle bg-bg-card p-3"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent"><Users size={16} /></span><div className="min-w-0"><b className="block truncate text-sm">{seller.name}</b><span className="block truncate text-[10px] font-bold text-text-muted">{seller.phone || 'Sin contacto'}</span></div></div><p className="mt-3 text-xs font-bold text-success">{sold} boletas · {money(sold * selectedRaffle.ticketPrice)}</p></article>; })}</div>}

        <div className="mt-6 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Ventas registradas</h2><p className="mt-0.5 text-xs text-text-muted">Cada registro suma boletas al recaudo de esta rifa.</p></div>{!isArchived && <button disabled={selectedSellers.length === 0} onClick={() => openSaleForm()} className="primary-button min-h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} /> Registrar</button>}</div>
        {selectedSales.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-border-medium bg-bg-card/45 p-5 text-center text-xs text-text-secondary">Aún no hay ventas registradas para esta rifa.</div> : <div className="mt-3 flex flex-col gap-2">{selectedSales.map(sale => { const seller = sellers.find(item => item.id === sale.sellerId); return <article key={sale.id} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-card p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success"><Ticket size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><b className="truncate text-sm">Venta registrada</b><strong className="shrink-0 text-sm text-success">{money(sale.tickets * selectedRaffle.ticketPrice)}</strong></div><p className="mt-1 text-[10px] font-bold text-text-muted">{sale.tickets} boletas · {seller?.name || 'Vendedor eliminado'} · {new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${sale.date}T00:00:00Z`))}</p></div>{!isArchived && <div className="flex shrink-0 items-center gap-1"><button onClick={() => openSaleForm(sale)} className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-accent-soft hover:text-accent" aria-label="Editar venta"><Pencil size={15} /></button><button onClick={() => setSalePendingDeletion(sale)} className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label="Eliminar venta"><Trash2 size={15} /></button></div>}</article>; })}</div>}
      </motion.section>}

      <AnimatePresence>{showRaffleForm && <Modal title="Nueva rifa" subtitle="Define la campaña antes de repartir las boletas." onClose={() => setShowRaffleForm(false)}><form onSubmit={createRaffle} className="flex flex-col gap-4"><label className="form-label">Nombre de la rifa<input autoFocus required value={raffleForm.name} onChange={event => setRaffleForm(current => ({ ...current, name: event.target.value }))} className="field" placeholder="Ej. Rifa pro retiro" /></label><label className="form-label">Premio <span className="text-text-muted">(opcional)</span><input value={raffleForm.prize} onChange={event => setRaffleForm(current => ({ ...current, prize: event.target.value }))} className="field" placeholder="Ej. Canasta especial" /></label><div className="grid grid-cols-2 gap-3"><label className="form-label">Meta financiera<input required type="number" min="1" inputMode="numeric" value={raffleForm.goal} onChange={event => setRaffleForm(current => ({ ...current, goal: event.target.value }))} className="field" placeholder="$0" /></label><label className="form-label">Valor por boleta<input required type="number" min="1" inputMode="numeric" value={raffleForm.ticketPrice} onChange={event => setRaffleForm(current => ({ ...current, ticketPrice: event.target.value }))} className="field" placeholder="$0" /></label></div><div className="grid grid-cols-2 gap-3"><label className="form-label">Cantidad de boletas<input required type="number" min="1" inputMode="numeric" value={raffleForm.ticketCount} onChange={event => setRaffleForm(current => ({ ...current, ticketCount: event.target.value }))} className="field" placeholder="100" /></label><label className="form-label">Fecha de sorteo <span className="text-text-muted">(opcional)</span><input type="date" value={raffleForm.drawDate} onChange={event => setRaffleForm(current => ({ ...current, drawDate: event.target.value }))} className="field" /></label></div><ModalActions onCancel={() => setShowRaffleForm(false)} label="Crear rifa" /></form></Modal>}</AnimatePresence>
      <AnimatePresence>{showSellerForm && <Modal title="Agregar vendedor" subtitle="Podrás identificar el recaudo que aporta a esta rifa." onClose={() => setShowSellerForm(false)}><form onSubmit={createSeller} className="flex flex-col gap-4"><label className="form-label">Nombre completo<input autoFocus required value={sellerForm.name} onChange={event => setSellerForm(current => ({ ...current, name: event.target.value }))} className="field" placeholder="Nombre del vendedor" /></label><label className="form-label">Teléfono <span className="text-text-muted">(opcional)</span><input value={sellerForm.phone} onChange={event => setSellerForm(current => ({ ...current, phone: event.target.value }))} className="field" placeholder="300 000 0000" /></label><ModalActions onCancel={() => setShowSellerForm(false)} label="Agregar vendedor" /></form></Modal>}</AnimatePresence>
      <AnimatePresence>{showSaleForm && <Modal title={saleBeingEdited ? 'Editar venta' : 'Registrar venta'} subtitle="La venta se suma al recaudo y a las boletas vendidas." onClose={closeSaleForm}><form onSubmit={saveSale} className="flex flex-col gap-4"><label className="form-label">Vendedor<select required value={saleForm.sellerId} onChange={event => setSaleForm(current => ({ ...current, sellerId: event.target.value }))} className="field">{selectedSellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="form-label">Boletas vendidas<input autoFocus required type="number" min="1" max={selectedRaffle ? selectedRaffle.ticketCount - (selectedStats?.ticketsSold || 0) + (saleBeingEdited?.tickets || 0) : undefined} inputMode="numeric" value={saleForm.tickets} onChange={event => setSaleForm(current => ({ ...current, tickets: event.target.value }))} className="field" placeholder="1" /></label><label className="form-label">Fecha<input required type="date" value={saleForm.date} onChange={event => setSaleForm(current => ({ ...current, date: event.target.value }))} className="field" /></label></div><ModalActions onCancel={closeSaleForm} label={saleBeingEdited ? 'Guardar cambios' : 'Registrar venta'} /></form></Modal>}</AnimatePresence>
      <AnimatePresence>{rafflePendingCompletion && <motion.div className="fixed inset-0 z-[86] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="complete-raffle-title" className="w-full max-w-sm rounded-3xl border border-success/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success"><CheckCircle2 size={19} /></span><h2 id="complete-raffle-title" className="mt-4 text-lg font-bold">¿Concluir rifa?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se registrará un ingreso de <b className="text-text-primary">{money(statsFor(rafflePendingCompletion.id).raised)}</b> en Todo el retiro y la rifa quedará archivada como histórico sin edición.</p><div className="mt-5 flex gap-2"><button onClick={() => setRafflePendingCompletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={concludeRaffle} className="primary-button flex-1"><CheckCircle2 size={16} /> Concluir</button></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{salePendingDeletion && <motion.div className="fixed inset-0 z-[86] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-sale-title" className="w-full max-w-sm rounded-3xl border border-danger/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><Trash2 size={19} /></span><h2 id="delete-sale-title" className="mt-4 text-lg font-bold">¿Eliminar venta?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se retirarán {salePendingDeletion.tickets} boletas del recaudo de esta rifa.</p><div className="mt-5 flex gap-2"><button onClick={() => setSalePendingDeletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={deleteSale} className="danger-button flex-1">Eliminar</button></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{rafflePendingDeletion && <motion.div className="fixed inset-0 z-[85] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="alertdialog" aria-modal="true" aria-labelledby="delete-raffle-title" className="w-full max-w-sm rounded-3xl border border-danger/30 bg-bg-secondary p-5 shadow-2xl" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><Trash2 size={19} /></span><h2 id="delete-raffle-title" className="mt-4 text-lg font-bold">¿Eliminar rifa?</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Se eliminarán <b className="text-text-primary">{rafflePendingDeletion.name}</b>, sus vendedores y sus ventas registradas.</p><div className="mt-5 flex gap-2"><button onClick={() => setRafflePendingDeletion(null)} className="secondary-button flex-1">Cancelar</button><button onClick={deleteRaffle} className="danger-button flex-1">Eliminar</button></div></motion.div></motion.div>}</AnimatePresence>
      <style jsx>{`.field { width: 100%; height: 3rem; border-radius: 1rem; border: 1px solid var(--border-subtle); background: var(--bg-primary); padding: 0 1rem; font-size: .875rem; color: var(--text-primary); outline: none; } .field:focus { border-color: var(--accent); }`}</style>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <motion.div className="fixed inset-0 z-[84] grid place-items-center bg-[#07050fb8] p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-border-medium bg-bg-secondary shadow-2xl" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}><header className="flex items-center justify-between bg-gradient-to-r from-warning/20 to-accent/10 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-warning">Rifas</p><h2 className="mt-1 text-lg font-bold">{title}</h2><p className="mt-1 text-xs text-text-secondary">{subtitle}</p></div><button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar"><X size={17} /></button></header><div className="p-5">{children}</div></motion.div></motion.div>;
}

function ModalActions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return <div className="mt-1 flex gap-2"><button type="button" onClick={onCancel} className="secondary-button flex-1">Cancelar</button><button className="primary-button flex-1"><Ticket size={16} /> {label}</button></div>;
}
