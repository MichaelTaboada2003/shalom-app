'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing, CalendarClock, CalendarDays, Check, ChevronDown, Mail, MailPlus,
  Pencil, Plus, Trash2, UsersRound, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { addDays, birthdayDateForYear } from '@/lib/birthday-reminders';
import type { Member } from '@/lib/community';
import { MemberAvatar } from '@/components/member-avatar';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';

interface Recipient { id?: string; email: string; name: string | null; source?: string; }
interface BirthdayReminder {
  id: string; member_id: string; title: string; days_before: number; subject: string | null; message: string | null;
  active: boolean; created_at: string; updated_at: string; member_name: string; member_birth_date: string;
  recipients: Recipient[] | string;
}

type FormState = { memberId: string; title: string; daysBefore: number; subject: string; message: string; active: boolean; recipients: Recipient[]; };
const emptyForm: FormState = { memberId: '', title: '', daysBefore: 7, subject: '', message: '', active: true, recipients: [] };
const inputClass = 'h-12 w-full rounded-2xl border border-border-subtle bg-bg-primary px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-4 focus:ring-accent/10';

function normalizeRecipients(value: BirthdayReminder['recipients']): Recipient[] {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value) as Recipient[]; } catch { return []; }
}

function toForm(reminder?: BirthdayReminder | null): FormState {
  if (!reminder) return emptyForm;
  return { memberId: reminder.member_id, title: reminder.title, daysBefore: Number(reminder.days_before), subject: reminder.subject ?? '', message: reminder.message ?? '', active: reminder.active, recipients: normalizeRecipients(reminder.recipients) };
}

function labelDate(value: Date) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(value);
}

function nextDispatch(birthDate: string, daysBefore: number) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let dispatch = addDays(birthdayDateForYear(birthDate, today.getUTCFullYear()), -daysBefore);
  if (dispatch < today) dispatch = addDays(birthdayDateForYear(birthDate, today.getUTCFullYear() + 1), -daysBefore);
  return dispatch;
}

function ReminderForm({ reminder, members, contacts, onClose, onSaved }: { reminder?: BirthdayReminder | null; members: Member[]; contacts: Recipient[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(() => toForm(reminder));
  const [customEmail, setCustomEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const validMembers = members.filter(member => member.status === 'active' && member.birth_date);
  const selectedEmails = new Set(form.recipients.map(recipient => recipient.email));
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));

  const toggleRecipient = (recipient: Recipient) => {
    setForm(current => current.recipients.some(item => item.email === recipient.email)
      ? { ...current, recipients: current.recipients.filter(item => item.email !== recipient.email) }
      : { ...current, recipients: [...current.recipients, recipient] });
  };
  const addCustomEmail = () => {
    const email = customEmail.trim().toLowerCase();
    if (!email || selectedEmails.has(email)) return;
    setForm(current => ({ ...current, recipients: [...current.recipients, { email, name: null }] }));
    setCustomEmail('');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const response = await fetch(reminder ? `/api/birthday-reminders/${reminder.id}` : '/api/birthday-reminders', {
        method: reminder ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar');
      onSaved(); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 px-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.form initial={{ y: 28, opacity: .8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} onSubmit={submit} className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-border-medium bg-bg-secondary shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]">
        <header className="flex items-start justify-between gap-5 border-b border-border-subtle px-5 py-5 sm:px-7 sm:py-6">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-accent">Cumpleaños</p><h2 className="mt-1 text-2xl font-bold">{reminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2><p className="mt-1 text-sm text-text-secondary">Define el aviso y a quién debe llegar.</p></div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
          {error && <div role="alert" className="mb-5 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <label className="form-label sm:col-span-2">¿De quién es el cumpleaños?<select required value={form.memberId} onChange={event => update('memberId', event.target.value)} className={inputClass}><option value="">Selecciona un integrante</option>{validMembers.map(member => <option key={member.id} value={member.id}>{member.full_name} · {member.birth_date?.slice(5).split('-').reverse().join('/')}</option>)}</select></label>
            <label className="form-label">Nombre interno<input required value={form.title} onChange={event => update('title', event.target.value)} className={inputClass} placeholder="Ej. Avisar equipo de música" /></label>
            <label className="form-label">Días antes<input required min={0} max={365} type="number" value={form.daysBefore} onChange={event => update('daysBefore', Number(event.target.value))} className={inputClass} /></label>
            <label className="form-label sm:col-span-2">Asunto del correo <span className="font-normal text-text-muted">(opcional)</span><input value={form.subject} onChange={event => update('subject', event.target.value)} className={inputClass} placeholder="Recordatorio: se acerca un cumpleaños" /></label>
            <label className="form-label sm:col-span-2">Mensaje <span className="font-normal text-text-muted">(opcional)</span><textarea value={form.message} onChange={event => update('message', event.target.value)} className={`${inputClass} h-28 resize-y py-3`} placeholder="Escribe el mensaje que recibirán las personas seleccionadas…" /></label>
          </div>
          <section className="mt-7 rounded-3xl border border-border-subtle bg-bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-bold">Personas que recibirán el correo</h3><p className="mt-1 max-w-xl text-xs leading-5 text-text-secondary">Selecciona uno o varios contactos, o añade correos manuales.</p></div><span className="grid h-7 min-w-7 place-items-center rounded-full bg-accent-soft px-2 text-xs font-black text-accent">{form.recipients.length}</span></div>
            <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl border border-border-subtle bg-bg-primary/35 p-1.5 pr-2">{contacts.map(contact => <button key={contact.email} type="button" onClick={() => toggleRecipient(contact)} className={`recipient-choice ${selectedEmails.has(contact.email) ? 'recipient-choice-active' : ''}`}><span className={`recipient-check ${selectedEmails.has(contact.email) ? 'recipient-check-active' : ''}`}>{selectedEmails.has(contact.email) && <Check size={12} />}</span><span className="min-w-0 flex-1 text-left"><b className="block truncate text-sm">{contact.name || contact.email}</b><small className="block truncate">{contact.email}</small></span></button>)}</div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="email" value={customEmail} onChange={event => setCustomEmail(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomEmail(); } }} className={inputClass} placeholder="otro@correo.com" /><button onClick={addCustomEmail} type="button" className="secondary-button shrink-0">Añadir correo</button></div>
            {form.recipients.some(recipient => !contacts.some(contact => contact.email === recipient.email)) && <div className="mt-4 flex flex-wrap gap-2">{form.recipients.filter(recipient => !contacts.some(contact => contact.email === recipient.email)).map(recipient => <button key={recipient.email} type="button" onClick={() => toggleRecipient(recipient)} className="email-chip">{recipient.email}<X size={13} /></button>)}</div>}
          </section>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-bg-card px-4 py-4"><span><b className="block text-sm">Recordatorio activo</b><small className="mt-1 block leading-5 text-text-muted">Se programará en el próximo ciclo de cumpleaños.</small></span><input type="checkbox" checked={form.active} onChange={event => update('active', event.target.checked)} className="h-5 w-5 shrink-0 accent-accent" /></label>
        </div>
        <footer className="grid grid-cols-2 gap-3 border-t border-border-subtle bg-bg-secondary/95 px-5 py-4 backdrop-blur sm:px-7"><button type="button" onClick={onClose} className="secondary-button">Cancelar</button><button disabled={saving || !form.memberId || !form.title.trim() || form.recipients.length === 0} className="primary-button">{saving ? 'Guardando…' : 'Guardar recordatorio'}</button></footer>
      </motion.form>
    </motion.div>
  );
}

export default function CumpleaniosPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<BirthdayReminder[]>([]); const [members, setMembers] = useState<Member[]>([]); const [contacts, setContacts] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState<BirthdayReminder | null | undefined>(undefined); const [expanded, setExpanded] = useState<string | null>(null);
  const [reminderPendingDeletion, setReminderPendingDeletion] = useState<BirthdayReminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState(false);
  const canManage = user?.role === 'admin' || user?.role === 'leader';
  const load = useCallback(async () => { try { const [remindersResponse, membersResponse, contactsResponse] = await Promise.all([fetch('/api/birthday-reminders'), fetch('/api/members'), fetch('/api/reminder-recipients')]); const [remindersData, membersData, contactsData] = await Promise.all([remindersResponse.json(), membersResponse.json(), contactsResponse.json()]); if (!remindersResponse.ok) throw new Error(remindersData.error || 'No se pudieron cargar los recordatorios'); setReminders(remindersData); if (membersResponse.ok) setMembers(membersData); if (contactsResponse.ok) setContacts(contactsData); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el módulo'); } finally { setLoading(false); } }, []);
  useEffect(() => { if (user) load(); }, [user, load]);
  const activeCount = useMemo(() => reminders.filter(reminder => reminder.active).length, [reminders]);
  const recipientCount = useMemo(() => reminders.reduce((total, reminder) => total + normalizeRecipients(reminder.recipients).length, 0), [reminders]);
  const remove = async () => { if (!reminderPendingDeletion) return; setDeletingReminder(true); const response = await fetch(`/api/birthday-reminders/${reminderPendingDeletion.id}`, { method: 'DELETE' }); if (response.ok) { setReminders(current => current.filter(item => item.id !== reminderPendingDeletion.id)); setReminderPendingDeletion(null); } else { setError('No se pudo eliminar el recordatorio'); } setDeletingReminder(false); };
  if (!user) return null;

  return (
    <div className="birthday-page mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
      <section className="birthday-hero relative overflow-hidden rounded-[2rem] border border-border-medium px-6 py-8 sm:px-9 sm:py-10"><div className="relative z-10 max-w-xl"><div className="eyebrow"><BellRing size={14} /> Cuidado de la comunidad</div><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Que ningún <span className="text-accent">cumpleaños</span> pase desapercibido.</h1><p className="mt-4 max-w-lg text-sm leading-7 text-text-secondary sm:text-base">Programa los avisos una vez. Shalom envía el recordatorio correcto, el día correcto, a las personas que tú elijas.</p>{canManage ? <button onClick={() => setEditing(null)} className="primary-button mt-7"><Plus size={17} /> Crear recordatorio</button> : <p className="mt-7 inline-flex rounded-full border border-border-subtle bg-bg-primary/35 px-3 py-2 text-xs font-bold text-text-secondary">Consulta los próximos avisos de la comunidad.</p>}</div><div className="birthday-cake-decoration" aria-hidden="true"><span /><span /><span /></div></section>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="stat-card"><BellRing size={18} className="text-accent" /><strong>{activeCount}</strong><span>avisos activos</span></div><div className="stat-card"><UsersRound size={18} className="text-success" /><strong>{recipientCount}</strong><span>destinatarios</span></div><div className="stat-card"><CalendarClock size={18} className="text-warning" /><strong>{members.filter(member => member.birth_date).length}</strong><span>fechas disponibles</span></div></section>
      {error && <div role="alert" className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      {loading ? <div className="grid place-items-center py-24"><div className="loader" /></div> : reminders.length === 0 ? <div className="empty-state"><MailPlus size={30} /><h3>Empieza con una celebración</h3><p>{canManage ? 'Elige a un integrante, cuántos días antes avisar y los correos que deben recibirlo.' : 'Aún no hay recordatorios de cumpleaños para consultar.'}</p>{canManage && <button onClick={() => setEditing(null)} className="primary-button mt-2"><Plus size={16} /> Primer recordatorio</button>}</div> : <div className="space-y-4">{reminders.map((reminder, index) => { const isOpen = expanded === reminder.id; const recipients = normalizeRecipients(reminder.recipients); return <motion.article key={reminder.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 7) * .04 }} className={`reminder-card ${reminder.active ? '' : 'opacity-60'}`}><button onClick={() => setExpanded(isOpen ? null : reminder.id)} className="flex w-full items-center gap-4 px-4 py-5 text-left sm:px-5"><MemberAvatar name={reminder.member_name} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{reminder.title}</h3><span className={`status-badge ${reminder.active ? '' : 'status-badge-muted'}`}>{reminder.active ? 'Activo' : 'Pausado'}</span></div><p className="mt-1 text-sm text-text-secondary">{reminder.member_name} · {reminder.days_before === 0 ? 'el mismo día' : `${reminder.days_before} días antes`}</p></div><ChevronDown size={18} className={`shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button><AnimatePresence>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="border-t border-border-subtle px-4 py-5 sm:px-5"><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="mini-info"><CalendarDays size={16} /><span><small>Próximo envío</small>{labelDate(nextDispatch(reminder.member_birth_date, Number(reminder.days_before)))}</span></div><div className="mini-info"><Mail size={16} /><span><small>Destinatarios</small>{recipients.length} correo{recipients.length === 1 ? '' : 's'}</span></div></div>{reminder.subject && <p className="mt-5 rounded-2xl bg-bg-primary px-4 py-3 text-sm text-text-secondary"><b className="text-text-primary">Asunto:</b> {reminder.subject}</p>}{reminder.message && <p className="mt-3 rounded-2xl bg-bg-primary px-4 py-3 text-sm leading-6 text-text-secondary">{reminder.message}</p>}<div className="mt-5 flex flex-wrap gap-2">{recipients.map(recipient => <span key={recipient.email} className="email-chip"><Mail size={12} />{recipient.name || recipient.email}</span>)}</div>{canManage && <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => setEditing(reminder)} className="secondary-button"><Pencil size={16} /> Editar</button><button onClick={() => setReminderPendingDeletion(reminder)} className="danger-button"><Trash2 size={16} /> Eliminar</button></div>}</div></motion.div>}</AnimatePresence></motion.article>; })}</div>}
      <AnimatePresence>{editing !== undefined && <ReminderForm key={editing?.id ?? 'new'} reminder={editing} members={members} contacts={contacts} onClose={() => setEditing(undefined)} onSaved={load} />}</AnimatePresence>
      <ConfirmDeleteDialog open={Boolean(reminderPendingDeletion)} title="¿Eliminar este recordatorio?" description={<>Vas a eliminar <b className="text-text-primary">{reminderPendingDeletion?.title}</b>. Esta acción no se puede deshacer.</>} onCancel={() => setReminderPendingDeletion(null)} onConfirm={remove} loading={deletingReminder} />
    </div>
  );
}
