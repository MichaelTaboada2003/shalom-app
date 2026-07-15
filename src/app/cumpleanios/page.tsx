'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BellRing, CalendarClock, CalendarDays, Check, ChevronDown, Mail, MailPlus,
  Pencil, Plus, Send, Trash2, UsersRound, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { addDays, birthdayDateForYear } from '@/lib/birthday-reminders';
import type { Member } from '@/lib/community';
import { MemberAvatar } from '@/components/member-avatar';

interface Recipient { id?: string; email: string; name: string | null; source?: string; }
interface BirthdayReminder {
  id: string; member_id: string; title: string; days_before: number; subject: string | null; message: string | null;
  active: boolean; created_at: string; updated_at: string; member_name: string; member_birth_date: string;
  recipients: Recipient[] | string;
}

type FormState = { memberId: string; title: string; daysBefore: number; subject: string; message: string; active: boolean; recipients: Recipient[]; };
const emptyForm: FormState = { memberId: '', title: '', daysBefore: 7, subject: '', message: '', active: true, recipients: [] };
const inputClass = 'w-full h-11 rounded-xl border border-border-subtle bg-bg-primary px-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-muted';

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
  const year = today.getUTCFullYear();
  let dispatch = addDays(birthdayDateForYear(birthDate, year), -daysBefore);
  if (dispatch < today) dispatch = addDays(birthdayDateForYear(birthDate, year + 1), -daysBefore);
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

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"><motion.form initial={{ y: 28 }} animate={{ y: 0 }} exit={{ y: 28 }} onSubmit={submit} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-border-medium bg-bg-secondary p-5 shadow-2xl sm:rounded-[2rem]"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Cumpleaños</p><h2 className="mt-1 text-xl font-bold">{reminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2></div><button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar"><X size={18} /></button></div>{error && <div role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}<div className="grid gap-3 sm:grid-cols-2"><label className="form-label sm:col-span-2">¿De quién es el cumpleaños?<select required value={form.memberId} onChange={event => update('memberId', event.target.value)} className={inputClass}><option value="">Selecciona un integrante</option>{validMembers.map(member => <option key={member.id} value={member.id}>{member.full_name} · {member.birth_date?.slice(5).split('-').reverse().join('/')}</option>)}</select></label><label className="form-label">Nombre interno<input required value={form.title} onChange={event => update('title', event.target.value)} className={inputClass} placeholder="Ej. Avisar equipo de música" /></label><label className="form-label">Días antes<input required min={0} max={365} type="number" value={form.daysBefore} onChange={event => update('daysBefore', Number(event.target.value))} className={inputClass} /></label><label className="form-label sm:col-span-2">Asunto del correo <span className="font-normal text-text-muted">(opcional)</span><input value={form.subject} onChange={event => update('subject', event.target.value)} className={inputClass} placeholder="Recordatorio: se acerca un cumpleaños" /></label><label className="form-label sm:col-span-2">Mensaje <span className="font-normal text-text-muted">(opcional)</span><textarea value={form.message} onChange={event => update('message', event.target.value)} className={`${inputClass} h-24 py-3`} placeholder="Escribe el mensaje que recibirán las personas seleccionadas…" /></label></div><section className="mt-5 rounded-2xl border border-border-subtle bg-bg-card p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Personas que recibirán el correo</h3><p className="mt-1 text-xs text-text-secondary">Selecciona uno o varios contactos, o añade correos manuales.</p></div><span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">{form.recipients.length}</span></div><div className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1">{contacts.map(contact => <button key={contact.email} type="button" onClick={() => toggleRecipient(contact)} className={`recipient-choice ${selectedEmails.has(contact.email) ? 'recipient-choice-active' : ''}`}><span className={`recipient-check ${selectedEmails.has(contact.email) ? 'recipient-check-active' : ''}`}>{selectedEmails.has(contact.email) && <Check size={12} />}</span><span className="min-w-0 flex-1 text-left"><b className="block truncate text-sm">{contact.name || contact.email}</b><small className="block truncate">{contact.email}</small></span></button>)}</div><div className="mt-3 flex gap-2"><input type="email" value={customEmail} onChange={event => setCustomEmail(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomEmail(); } }} className={inputClass} placeholder="otro@correo.com" /><button onClick={addCustomEmail} type="button" className="secondary-button shrink-0">Añadir</button></div>{form.recipients.some(recipient => !contacts.some(contact => contact.email === recipient.email)) && <div className="mt-3 flex flex-wrap gap-2">{form.recipients.filter(recipient => !contacts.some(contact => contact.email === recipient.email)).map(recipient => <button key={recipient.email} type="button" onClick={() => toggleRecipient(recipient)} className="email-chip">{recipient.email}<X size={13} /></button>)}</div>}</section><label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-4 py-3"><span><b className="block text-sm">Recordatorio activo</b><small className="text-text-muted">Se programará en el próximo ciclo de cumpleaños.</small></span><input type="checkbox" checked={form.active} onChange={event => update('active', event.target.checked)} className="h-5 w-5 accent-accent" /></label><div className="mt-6 flex gap-3"><button type="button" onClick={onClose} className="secondary-button flex-1">Cancelar</button><button disabled={saving || !form.memberId || !form.title.trim() || form.recipients.length === 0} className="primary-button flex-1">{saving ? 'Guardando…' : 'Guardar recordatorio'}</button></div></motion.form></motion.div>;
}

export default function CumpleaniosPage() {
  const { user } = useAuth(); const router = useRouter();
  const [reminders, setReminders] = useState<BirthdayReminder[]>([]); const [members, setMembers] = useState<Member[]>([]); const [contacts, setContacts] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState<BirthdayReminder | null | undefined>(undefined); const [expanded, setExpanded] = useState<string | null>(null);
  const canManage = user?.role === 'admin' || user?.role === 'leader';
  useEffect(() => { if (user && !canManage) router.replace('/checklist'); }, [user, canManage, router]);
  const load = useCallback(async () => { try { const [remindersResponse, membersResponse, contactsResponse] = await Promise.all([fetch('/api/birthday-reminders'), fetch('/api/members'), fetch('/api/reminder-recipients')]); const [remindersData, membersData, contactsData] = await Promise.all([remindersResponse.json(), membersResponse.json(), contactsResponse.json()]); if (!remindersResponse.ok) throw new Error(remindersData.error || 'No se pudieron cargar los recordatorios'); setReminders(remindersData); if (membersResponse.ok) setMembers(membersData); if (contactsResponse.ok) setContacts(contactsData); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el módulo'); } finally { setLoading(false); } }, []);
  useEffect(() => { if (canManage) load(); }, [canManage, load]);
  const activeCount = useMemo(() => reminders.filter(reminder => reminder.active).length, [reminders]);
  const remove = async (reminder: BirthdayReminder) => { if (!window.confirm(`¿Eliminar “${reminder.title}”?`)) return; const response = await fetch(`/api/birthday-reminders/${reminder.id}`, { method: 'DELETE' }); if (response.ok) setReminders(current => current.filter(item => item.id !== reminder.id)); };
  if (!canManage) return null;
  return <div className="mx-auto max-w-5xl px-4 pb-8 pt-5 sm:px-6"><section className="birthday-hero relative overflow-hidden rounded-[2rem] border border-border-medium p-6 sm:p-8"><div className="relative z-10 max-w-xl"><div className="eyebrow"><BellRing size={14} /> Cuidado de la comunidad</div><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Que ningún <span className="text-accent">cumpleaños</span> pase desapercibido.</h1><p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">Programa los avisos una vez. Shalom envía el recordatorio correcto, el día correcto, a las personas que tú elijas.</p><button onClick={() => setEditing(null)} className="primary-button mt-6"><Plus size={17} /> Crear recordatorio</button></div><div className="birthday-cake-decoration"><span /><span /><span /></div></section><section className="-mt-2 grid grid-cols-2 gap-3 px-2 sm:grid-cols-3"><div className="stat-card"><BellRing size={18} className="text-accent" /><strong>{activeCount}</strong><span>avisos activos</span></div><div className="stat-card"><UsersRound size={18} className="text-success" /><strong>{reminders.reduce((total, reminder) => total + normalizeRecipients(reminder.recipients).length, 0)}</strong><span>destinatarios</span></div><div className="stat-card col-span-2 sm:col-span-1"><CalendarClock size={18} className="text-warning" /><strong>{members.filter(member => member.birth_date).length}</strong><span>fechas disponibles</span></div></section><section className="mt-8 rounded-2xl border border-accent/20 bg-accent-soft/50 p-4"><div className="flex gap-3"><Send size={18} className="mt-0.5 shrink-0 text-accent" /><div><h2 className="font-bold">Envío automático y seguro</h2><p className="mt-1 text-sm leading-6 text-text-secondary">El cron revisa los avisos cada día y registra cada envío para que un correo no se repita. Configura <code>RESEND_API_KEY</code>, <code>REMINDER_FROM_EMAIL</code> y <code>CRON_SECRET</code> al publicar.</p></div></div></section>{error && <div role="alert" className="mt-5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}{loading ? <div className="grid place-items-center py-20"><div className="loader" /></div> : reminders.length === 0 ? <div className="empty-state mt-5"><MailPlus size={30} /><h3>Empieza con una celebración</h3><p>Elige a un integrante, cuántos días antes avisar y los correos que deben recibirlo.</p><button onClick={() => setEditing(null)} className="primary-button mt-2"><Plus size={16} /> Primer recordatorio</button></div> : <div className="mt-5 space-y-3">{reminders.map((reminder, index) => { const isOpen = expanded === reminder.id; const recipients = normalizeRecipients(reminder.recipients); return <motion.article key={reminder.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 7) * 0.04 }} className={`reminder-card ${reminder.active ? '' : 'opacity-60'}`}><button onClick={() => setExpanded(isOpen ? null : reminder.id)} className="flex w-full items-center gap-3 p-4 text-left"><MemberAvatar name={reminder.member_name} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{reminder.title}</h3><span className={`status-badge ${reminder.active ? '' : 'status-badge-muted'}`}>{reminder.active ? 'Activo' : 'Pausado'}</span></div><p className="mt-1 text-sm text-text-secondary">{reminder.member_name} · {reminder.days_before === 0 ? 'el mismo día' : `${reminder.days_before} días antes`}</p></div><ChevronDown size={18} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button><AnimatePresence>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="border-t border-border-subtle px-4 pb-4 pt-4"><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="mini-info"><CalendarDays size={16} /><span><small>Próximo envío</small>{labelDate(nextDispatch(reminder.member_birth_date, Number(reminder.days_before)))}</span></div><div className="mini-info"><Mail size={16} /><span><small>Destinatarios</small>{recipients.length} correo{recipients.length === 1 ? '' : 's'}</span></div></div>{reminder.subject && <p className="mt-4 rounded-xl bg-bg-primary px-3 py-2 text-sm text-text-secondary"><b className="text-text-primary">Asunto:</b> {reminder.subject}</p>}{reminder.message && <p className="mt-2 rounded-xl bg-bg-primary px-3 py-2 text-sm leading-6 text-text-secondary">{reminder.message}</p>}<div className="mt-4 flex flex-wrap gap-2">{recipients.map(recipient => <span key={recipient.email} className="email-chip"><Mail size={12} />{recipient.name || recipient.email}</span>)}</div><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => setEditing(reminder)} className="secondary-button"><Pencil size={16} /> Editar</button><button onClick={() => remove(reminder)} className="danger-button"><Trash2 size={16} /> Eliminar</button></div></div></motion.div>}</AnimatePresence></motion.article>; })}</div>}<AnimatePresence>{editing !== undefined && <ReminderForm key={editing?.id ?? 'new'} reminder={editing} members={members} contacts={contacts} onClose={() => setEditing(undefined)} onSaved={load} />}</AnimatePresence></div>;
}
