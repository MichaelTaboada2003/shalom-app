'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck, CakeSlice, CalendarDays, ChevronRight, HeartHandshake, Mail, MapPin,
  Pencil, Phone, Plus, Search, ShieldCheck, Sparkles, Trash2, UsersRound, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  AVATAR_SKIN_TONES, AVATAR_STYLES, HAIR_STYLES_BY_GENDER,
  type AvatarGender, type AvatarHairStyle, type AvatarSkinTone, type AvatarStyle, type Member, type MemberStatus,
} from '@/lib/community';
import { CommunityCharacter, profileFromMember, type CharacterProfile } from '@/components/community-character';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import styles from './integrantes.module.css';

const avatarLabels: Record<AvatarStyle, string> = { lilac: 'Lila', sky: 'Cielo', mint: 'Menta', sunset: 'Sol', rose: 'Rosa' };
const swatchClasses: Record<AvatarStyle, string> = { lilac: styles.swatchLilac, sky: styles.swatchSky, mint: styles.swatchMint, sunset: styles.swatchSunset, rose: styles.swatchRose };
const genderLabels: Record<AvatarGender, string> = { woman: 'Mujer', man: 'Hombre' };
const skinLabels: Record<AvatarSkinTone, string> = { fair: 'Clara', light: 'Suave', medium: 'Media', tan: 'Canela', deep: 'Oscura' };
const hairLabels: Record<AvatarHairStyle, string> = { waves: 'Ondas', long: 'Largo', bun: 'Moño', braids: 'Trenzas', short: 'Corto', fade: 'Degradado', curls: 'Rizos', side: 'Lateral' };
const inputClass = 'w-full h-12 rounded-2xl border border-border-subtle bg-bg-primary/70 px-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 placeholder:text-text-muted';
type Filter = 'all' | 'active' | 'birthdays';
type FormState = { fullName: string; email: string; phone: string; birthDate: string; avatarStyle: AvatarStyle; avatarGender: AvatarGender; avatarSkinTone: AvatarSkinTone; avatarHairStyle: AvatarHairStyle; ministry: string; bio: string; status: MemberStatus; };
const emptyForm: FormState = { fullName: '', email: '', phone: '', birthDate: '', avatarStyle: 'lilac', avatarGender: 'woman', avatarSkinTone: 'medium', avatarHairStyle: 'waves', ministry: '', bio: '', status: 'active' };

function toForm(member?: Member | null): FormState {
  if (!member) return emptyForm;
  return {
    fullName: member.full_name, email: member.email ?? '', phone: member.phone ?? '', birthDate: member.birth_date?.slice(0, 10) ?? '',
    avatarStyle: member.avatar_style ?? 'lilac', avatarGender: member.avatar_gender ?? 'woman', avatarSkinTone: member.avatar_skin_tone ?? 'medium', avatarHairStyle: member.avatar_hair_style ?? 'waves',
    ministry: member.ministry ?? '', bio: member.bio ?? '', status: member.status,
  };
}

function formatBirthday(value?: string | null) {
  if (!value) return 'Sin cumpleaños';
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function birthdayDistance(value?: string | null) {
  if (!value) return null;
  const [, month, day] = value.slice(0, 10).split('-').map(Number);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let target = Date.UTC(now.getUTCFullYear(), month - 1, day);
  if (target < today) target = Date.UTC(now.getUTCFullYear() + 1, month - 1, day);
  const days = Math.round((target - today) / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days <= 30) return `En ${days} días`;
  return null;
}

function MemberForm({ member, onClose, onSaved }: { member?: Member | null; onClose: () => void; onSaved: (member: Member) => void }) {
  const [form, setForm] = useState<FormState>(() => toForm(member));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));
  const updateGender = (avatarGender: AvatarGender) => setForm(current => ({
    ...current,
    avatarGender,
    avatarHairStyle: HAIR_STYLES_BY_GENDER[avatarGender].includes(current.avatarHairStyle)
      ? current.avatarHairStyle
      : HAIR_STYLES_BY_GENDER[avatarGender][0],
  }));
  const preview: CharacterProfile = {
    id: member?.id ?? `preview-${form.fullName || 'shalom'}`,
    name: form.fullName || 'Nuevo integrante',
    avatarStyle: form.avatarStyle,
    avatarGender: form.avatarGender,
    avatarSkinTone: form.avatarSkinTone,
    avatarHairStyle: form.avatarHairStyle,
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(member ? `/api/members/${member.id}` : '/api/members', { method: member ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar');
      onSaved(data); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div className={styles.formOverlay} role="dialog" aria-modal="true" aria-label={member ? 'Editar integrante' : 'Nuevo integrante'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form className={styles.form} initial={{ opacity: 0, y: 28, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }} onSubmit={submit}>
        <div className={styles.formTop}>
          <CommunityCharacter profile={preview} size="large" selected className={styles.formPreview} />
          <div className={styles.formTitle}><small>Diseña su personaje</small><h2>{member ? 'Editar integrante' : 'Nueva persona'}</h2><p>Su ficha y su personaje viven conectados.</p></div>
          <button type="button" onClick={onClose} className={styles.formClose} aria-label="Cerrar formulario"><X size={18} /></button>
        </div>
        <div className={styles.formBody}>
          {error && <div role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          <div className={styles.formGrid}>
            <label className={`form-label ${styles.wide}`}>Nombre completo<input required value={form.fullName} onChange={event => update('fullName', event.target.value)} className={inputClass} placeholder="Nombre y apellidos" /></label>
            <label className="form-label">Correo<input type="email" value={form.email} onChange={event => update('email', event.target.value)} className={inputClass} placeholder="persona@correo.com" /></label>
            <label className="form-label">Teléfono<input value={form.phone} onChange={event => update('phone', event.target.value)} className={inputClass} placeholder="300 000 0000" /></label>
            <label className="form-label">Cumpleaños<input type="date" value={form.birthDate} onChange={event => update('birthDate', event.target.value)} className={inputClass} /></label>
            <label className="form-label">Servicio o grupo<input value={form.ministry} onChange={event => update('ministry', event.target.value)} className={inputClass} placeholder="Música, acogida…" /></label>
            <div className={styles.wide}><span className="form-label-text">Su personaje</span><p className={styles.appearanceHelp}>Elige sus rasgos para que se reconozca en Mundo Shalom.</p><div className={styles.genderChoices}>{(['woman', 'man'] as const).map(gender => <button key={gender} type="button" onClick={() => updateGender(gender)} className={`${styles.genderChoice} ${form.avatarGender === gender ? styles.styleChoiceActive : ''}`} aria-pressed={form.avatarGender === gender}><span className={styles.genderPortrait} data-gender={gender} />{genderLabels[gender]}</button>)}</div></div>
            <div className={styles.wide}><span className="form-label-text">Tono de piel</span><div className={styles.toneChoices}>{AVATAR_SKIN_TONES.map(tone => <button key={tone} type="button" onClick={() => update('avatarSkinTone', tone)} className={`${styles.toneChoice} ${form.avatarSkinTone === tone ? styles.styleChoiceActive : ''}`} aria-pressed={form.avatarSkinTone === tone}><span className={styles.skinSwatch} data-skin={tone} />{skinLabels[tone]}</button>)}</div></div>
            <div className={styles.wide}><span className="form-label-text">Peinado</span><div className={styles.hairChoices}>{HAIR_STYLES_BY_GENDER[form.avatarGender].map(hair => <button key={hair} type="button" onClick={() => update('avatarHairStyle', hair)} className={`${styles.hairChoice} ${form.avatarHairStyle === hair ? styles.styleChoiceActive : ''}`} aria-pressed={form.avatarHairStyle === hair}><span className={styles.hairSwatch} data-hair={hair} />{hairLabels[hair]}</button>)}</div></div>
            <div className={styles.wide}><span className="form-label-text">Color de su personaje</span><div className={styles.styleChoices}>{AVATAR_STYLES.map(style => <button key={style} type="button" onClick={() => update('avatarStyle', style)} className={`${styles.styleChoice} ${form.avatarStyle === style ? styles.styleChoiceActive : ''}`} aria-pressed={form.avatarStyle === style}><span className={`${styles.styleSwatch} ${swatchClasses[style]}`} />{avatarLabels[style]}</button>)}</div></div>
            <label className={`form-label ${styles.wide}`}>Lo que le hace especial<textarea value={form.bio} onChange={event => update('bio', event.target.value)} className={`${inputClass} h-28 py-3`} placeholder="Talentos, forma de servir, una historia bonita…" /></label>
            {member && <label className={`form-label ${styles.wide}`}>Estado<select value={form.status} onChange={event => update('status', event.target.value as MemberStatus)} className={inputClass}><option value="active">Activo en la comunidad</option><option value="inactive">Inactivo</option></select></label>}
          </div>
          <div className={styles.formActions}><button type="button" onClick={onClose} className="secondary-button flex-1">Cancelar</button><button disabled={saving || !form.fullName.trim()} className="primary-button flex-1">{saving ? 'Guardando…' : member ? 'Guardar cambios' : 'Crear integrante'}</button></div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function MemberCard({ member, index, onSelect }: { member: Member; index: number; onSelect: () => void }) {
  const birthday = birthdayDistance(member.birth_date);
  return (
    <motion.button className={styles.card} data-style={member.avatar_style} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .04 }} onClick={onSelect} aria-label={`Ver ficha de ${member.full_name}`}>
      <div className={styles.cardVisual}>
        <span className={`${styles.status} ${member.status === 'inactive' ? styles.statusInactive : ''}`}><span className={styles.statusDot} />{member.status === 'active' ? 'Activo' : 'Inactivo'}</span>
        {birthday && <span className={styles.birthday}><CakeSlice size={12} />{birthday}</span>}
        <CommunityCharacter profile={profileFromMember(member)} size="hero" className={styles.cardCharacter} />
      </div>
      <div className={styles.cardBody}>
        <h3>{member.full_name}</h3>
        <span className={styles.ministry}><Sparkles size={12} />{member.ministry || 'Comunidad Shalom'}</span>
        <p className={styles.bio}>{member.bio || 'Una persona especial que hace parte de la familia Shalom.'}</p>
        <div className={styles.cardFooter}><span><CalendarDays size={13} />{formatBirthday(member.birth_date)}</span><span className={styles.arrow}><ChevronRight size={15} /></span></div>
      </div>
    </motion.button>
  );
}

export default function IntegrantesPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | null | undefined>(undefined);
  const [memberPendingDeletion, setMemberPendingDeletion] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'admin' || user?.role === 'leader';

  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los integrantes');
      setMembers(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los integrantes'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const shownMembers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return members.filter(member => {
      const matchesSearch = !term || [member.full_name, member.ministry, member.email].filter(Boolean).join(' ').toLocaleLowerCase().includes(term);
      const matchesFilter = filter === 'all' || (filter === 'active' && member.status === 'active') || (filter === 'birthdays' && Boolean(member.birth_date));
      return matchesSearch && matchesFilter;
    });
  }, [filter, members, search]);
  const activeCount = members.filter(member => member.status === 'active').length;
  const birthdayCount = members.filter(member => member.birth_date).length;
  const heroMembers = members.filter(member => member.status === 'active').slice(0, 3);

  const saveMember = (saved: Member) => {
    setMembers(current => current.some(member => member.id === saved.id) ? current.map(member => member.id === saved.id ? saved : member) : [saved, ...current]);
    setSelected(current => current?.id === saved.id ? saved : current);
  };
  const removeMember = async () => {
    if (!memberPendingDeletion) return;
    setDeletingMember(true);
    const response = await fetch(`/api/members/${memberPendingDeletion.id}`, { method: 'DELETE' });
    if (!response.ok) { const data = await response.json(); setError(data.error || 'No se pudo eliminar'); setDeletingMember(false); return; }
    setMembers(current => current.filter(item => item.id !== memberPendingDeletion.id)); setSelected(null); setMemberPendingDeletion(null); setDeletingMember(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}><div className={styles.kicker}><HeartHandshake size={14} /> La familia Shalom</div><h1>Cada persona tiene una historia que merece <span>ser celebrada.</span></h1><p>Crea perfiles con alma: quiénes son, cómo sirven y el personaje que los representa en Mundo Shalom.</p>{canManage && <button onClick={() => setEditing(null)} className={`primary-button ${styles.heroAction}`}><Plus size={17} /> Crear integrante</button>}</div>
        {heroMembers.length > 0 && <div className={styles.heroPeople} aria-hidden="true">{heroMembers.map(member => <CommunityCharacter key={member.id} profile={profileFromMember(member)} size="hero" />)}</div>}
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}><span className={styles.statIcon}><UsersRound size={19} /></span><span><strong>{activeCount}</strong><small>personas activas</small></span></div>
        <div className={styles.stat}><span className={styles.statIcon}><CakeSlice size={19} /></span><span><strong>{birthdayCount}</strong><small>cumpleaños guardados</small></span></div>
        <div className={styles.stat}><span className={styles.statIcon}><Sparkles size={19} /></span><span><strong>{members.length}</strong><small>personajes creados</small></span></div>
      </section>

      <div className={styles.directoryHeader}><div><h2>Directorio de la comunidad</h2><p>Perfiles humanos, no cuentas de acceso.</p></div><label className={styles.search}><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar persona o grupo" aria-label="Buscar integrante" /></label></div>
      <div className={styles.filters} aria-label="Filtros de integrantes">
        <button className={`${styles.filter} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>Todos <span className={styles.filterCount}>{members.length}</span></button>
        <button className={`${styles.filter} ${filter === 'active' ? styles.filterActive : ''}`} onClick={() => setFilter('active')} aria-pressed={filter === 'active'}><BadgeCheck size={14} /> Activos <span className={styles.filterCount}>{activeCount}</span></button>
        <button className={`${styles.filter} ${filter === 'birthdays' ? styles.filterActive : ''}`} onClick={() => setFilter('birthdays')} aria-pressed={filter === 'birthdays'}><CakeSlice size={14} /> Con cumpleaños <span className={styles.filterCount}>{birthdayCount}</span></button>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      {loading ? <div className="grid place-items-center py-24"><div className="loader" /></div> : shownMembers.length === 0 ? <div className={`empty-state ${styles.empty}`}><UsersRound size={30} /><h3>No encontramos personas aquí</h3><p>{search ? 'Prueba con otro nombre o servicio.' : 'Crea el primer integrante para llenar la comunidad de historias.'}</p>{canManage && !search && <button onClick={() => setEditing(null)} className="primary-button"><Plus size={16} /> Crear integrante</button>}</div> : <div className={styles.grid}>{shownMembers.map((member, index) => <MemberCard key={member.id} member={member} index={index} onSelect={() => setSelected(member)} />)}</div>}

      <AnimatePresence>{editing !== undefined && <MemberForm key={editing?.id ?? 'new'} member={editing} onClose={() => setEditing(undefined)} onSaved={saveMember} />}</AnimatePresence>
      <AnimatePresence>{selected && <><motion.button className={styles.overlay} aria-label="Cerrar detalle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} /><motion.aside className={styles.detail} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 240, damping: 28 }}>
        <div className={styles.detailHero}><button onClick={() => setSelected(null)} className={styles.close} aria-label="Cerrar"><X size={18} /></button><CommunityCharacter profile={profileFromMember(selected)} size="hero" selected className={styles.detailCharacter} /></div>
        <div className={styles.detailContent}><div className={styles.detailHeading}><div><h2>{selected.full_name}</h2><p>{selected.ministry || 'Comunidad Shalom'}</p></div>{selected.status === 'active' && <span className={styles.activeBadge}><BadgeCheck size={12} /> Activo</span>}</div><p className={styles.detailBio}>{selected.bio || 'Esta persona hace parte de la familia Shalom.'}</p><div className={styles.details}><div className={styles.detailItem}><CalendarDays size={17} /><span><small>Cumpleaños</small>{formatBirthday(selected.birth_date)}</span></div>{selected.email && <a className={styles.detailItem} href={`mailto:${selected.email}`}><Mail size={17} /><span><small>Correo</small>{selected.email}</span></a>}{selected.phone && <a className={styles.detailItem} href={`tel:${selected.phone}`}><Phone size={17} /><span><small>Teléfono</small>{selected.phone}</span></a>}<div className={styles.detailItem}><MapPin size={17} /><span><small>Servicio</small>{selected.ministry || 'Comunidad'}</span></div></div>{canManage && <div className={styles.detailActions}><button onClick={() => { setEditing(selected); setSelected(null); }} className="secondary-button"><Pencil size={16} /> Editar</button><button onClick={() => setMemberPendingDeletion(selected)} className="danger-button"><Trash2 size={16} /> Eliminar</button></div>}<div className={styles.privacy}><ShieldCheck size={14} /> Este perfil no crea acceso ni contraseña.</div></div>
      </motion.aside></>}</AnimatePresence>
      <ConfirmDeleteDialog open={Boolean(memberPendingDeletion)} title="¿Eliminar este integrante?" description={<>Vas a eliminar a <b className="text-text-primary">{memberPendingDeletion?.full_name}</b> y sus recordatorios asociados. Esta acción no se puede deshacer.</>} onCancel={() => setMemberPendingDeletion(null)} onConfirm={removeMember} loading={deletingMember} />
    </div>
  );
}
