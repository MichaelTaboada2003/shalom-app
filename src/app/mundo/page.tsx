'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BellRing, BookHeart, CakeSlice, CalendarDays, Church, Hand, MapPin, Moon,
  Pause, Play, Sparkles, Sun, UsersRound, X,
} from 'lucide-react';
import type { Member } from '@/lib/community';
import { CommunityCharacter, profileFromMember } from '@/components/community-character';
import styles from './world.module.css';

const START_SPOTS = [
  { left: 12, top: 69 }, { left: 29, top: 61 }, { left: 47, top: 75 },
  { left: 68, top: 65 }, { left: 84, top: 73 }, { left: 22, top: 82 },
  { left: 58, top: 84 }, { left: 78, top: 52 }, { left: 39, top: 56 },
];
const WANDER_PATHS = [
  { x: [0, 48, 22, -24, 0], y: [0, -12, 18, 5, 0] },
  { x: [0, -34, -8, 38, 0], y: [0, 15, -10, 7, 0] },
  { x: [0, 28, 62, 18, 0], y: [0, -20, -4, 14, 0] },
  { x: [0, -54, -22, 20, 0], y: [0, -8, 20, -5, 0] },
];
const CONFETTI = Array.from({ length: 24 }, (_, index) => ({ left: `${4 + ((index * 37) % 92)}%`, delay: `${(index % 8) * .08}s` }));

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) - result + value.charCodeAt(index)) | 0;
  return Math.abs(result);
}

function birthdayLabel(value: string | null) {
  if (!value) return 'Sin cumpleaños registrado';
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function hasBirthdaySoon(value: string | null) {
  if (!value) return false;
  const [, month, day] = value.slice(0, 10).split('-').map(Number);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let target = Date.UTC(now.getUTCFullYear(), month - 1, day);
  if (target < today) target = Date.UTC(now.getUTCFullYear() + 1, month - 1, day);
  return Math.round((target - today) / 86_400_000) <= 30;
}

function WorldCharacter({ member, index, selected, paused, gathered, celebrating, reducedMotion, onSelect }: {
  member: Member;
  index: number;
  selected: boolean;
  paused: boolean;
  gathered: boolean;
  celebrating: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  const seed = hash(member.id);
  const start = START_SPOTS[index % START_SPOTS.length];
  const path = WANDER_PATHS[seed % WANDER_PATHS.length];
  const gatherColumn = index % 5;
  const gatherRow = Math.floor(index / 5);
  const canWalk = !paused && !gathered && !reducedMotion;
  const animate = gathered
    ? { left: `${35 + gatherColumn * 7.5}%`, top: `${68 + gatherRow * 11}%`, x: 0, y: 0, scale: selected ? 1.1 : 1 }
    : canWalk
      ? { x: path.x, y: path.y, scale: selected ? 1.1 : 1 }
      : { x: 0, y: 0, scale: selected ? 1.1 : 1 };
  const transition = gathered
    ? { type: 'spring' as const, stiffness: 120, damping: 18, delay: index * .035 }
    : canWalk
      ? { duration: 8 + (seed % 5), repeat: Infinity, ease: 'easeInOut' as const, delay: index * -.45 }
      : { type: 'spring' as const, stiffness: 160, damping: 20 };

  return (
    <motion.button
      type="button"
      className={styles.characterButton}
      style={{ left: `${start.left}%`, top: `${start.top}%`, zIndex: 20 + index }}
      animate={animate}
      transition={transition}
      onClick={onSelect}
      aria-label={`Conocer a ${member.full_name}`}
    >
      {hasBirthdaySoon(member.birth_date) && <span className={styles.birthdayPin} title="Cumpleaños cercano"><CakeSlice size={13} /></span>}
      <CommunityCharacter profile={profileFromMember(member)} size="medium" walking={canWalk} selected={selected} celebrating={celebrating} />
      <span className={styles.characterName}>{member.full_name.split(' ')[0]}</span>
    </motion.button>
  );
}

export default function MundoPage() {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [gathered, setGathered] = useState(false);
  const [night, setNight] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el mundo');
      setMembers(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el mundo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 3000);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  const villagers = useMemo(() => members.filter(member => member.status === 'active'), [members]);
  const heroMembers = villagers.slice(0, 3);
  const birthdaySoon = villagers.filter(member => hasBirthdaySoon(member.birth_date)).length;

  const toggleWalking = () => {
    setGathered(false);
    setPaused(current => !current);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.kicker}><Sparkles size={14} /> Un mundo que está vivo</div>
          <h1>Bienvenido al lugar donde la comunidad <span>cobra vida.</span></h1>
          <p>Los integrantes caminan, se reúnen y celebran juntos. Cada personaje guarda una historia real de la familia Shalom.</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span className={styles.heroStatIcon}><UsersRound size={17} /></span><span><strong>{villagers.length}</strong><small>habitantes activos</small></span></div>
            <div className={styles.heroStat}><span className={styles.heroStatIcon}><CakeSlice size={17} /></span><span><strong>{birthdaySoon}</strong><small>cumpleaños cercanos</small></span></div>
          </div>
        </div>
        {heroMembers.length > 0 && <div className={styles.heroCharacters} aria-hidden="true">{heroMembers.map(member => <CommunityCharacter key={member.id} profile={profileFromMember(member)} size="hero" />)}</div>}
      </section>

      <div className={styles.worldHeader}>
        <div><h2>La plaza de la comunidad</h2><p>Explora, reúne a todos o cambia la hora del día.</p></div>
        <span className={styles.liveBadge}><span className={styles.liveDot} /> Mundo en vivo</span>
      </div>

      <div className={styles.toolbar} role="toolbar" aria-label="Controles del mundo">
        <button className={`${styles.control} ${!paused && !gathered ? styles.controlActive : ''}`} onClick={toggleWalking} disabled={shouldReduceMotion} aria-pressed={!paused && !gathered}>
          {paused || gathered ? <Play size={16} /> : <Pause size={16} />}{paused || gathered ? 'Dejar caminar' : 'Pausar paseo'}
        </button>
        <button className={`${styles.control} ${gathered ? styles.controlActive : ''}`} onClick={() => setGathered(current => !current)} aria-pressed={gathered}><UsersRound size={16} />{gathered ? 'Volver a pasear' : 'Reunir comunidad'}</button>
        <button className={`${styles.control} ${night ? styles.controlActive : ''}`} onClick={() => setNight(current => !current)} aria-pressed={night}>{night ? <Sun size={16} /> : <Moon size={16} />}{night ? 'Hacer de día' : 'Ver de noche'}</button>
        <button className={styles.control} onClick={() => setCelebrating(true)}><BellRing size={16} /> Tocar campanas</button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
      {loading ? (
        <div className="grid place-items-center py-24"><div className="loader" /></div>
      ) : villagers.length === 0 ? (
        <div className="empty-state"><UsersRound size={30} /><h3>La plaza espera a la comunidad</h3><p>Crea perfiles en Integrantes y sus personajes aparecerán aquí.</p><button onClick={() => router.push('/integrantes')} className="primary-button">Crear integrantes</button></div>
      ) : (
        <div className={styles.sceneFrame}>
          <section className={`${styles.scene} ${night ? styles.night : ''}`} aria-label="Mundo interactivo de la comunidad Shalom">
            <div className={styles.sky} /><div className={styles.glow} />
            <span className={`${styles.star} ${styles.starOne}`} /><span className={`${styles.star} ${styles.starTwo}`} /><span className={`${styles.star} ${styles.starThree}`} /><span className={`${styles.star} ${styles.starFour}`} /><span className={`${styles.star} ${styles.starFive}`} /><span className={`${styles.star} ${styles.starSix}`} />
            <div className={`${styles.cloud} ${styles.cloudOne}`} /><div className={`${styles.cloud} ${styles.cloudTwo}`} /><div className={`${styles.cloud} ${styles.cloudThree}`} />
            <div className={styles.hillBack} /><div className={styles.hillFront} />
            <div className={styles.church}><div className={styles.churchCross} /><div className={styles.churchTower} /><div className={styles.churchRoof} /><div className={styles.churchMain} /><div className={styles.churchDoor} /><div className={`${styles.window} ${styles.windowLeft}`} /><div className={`${styles.window} ${styles.windowRight}`} /></div>
            <div className={styles.path} />
            <div className={styles.fountain}><span className={styles.fountainWater} /><span className={styles.fountainStem} /><span className={styles.fountainBase} /></div>
            <div className={`${styles.tree} ${styles.treeLeft}`}><span className={styles.treeTrunk} /><span className={styles.treeCrown} /></div>
            <div className={`${styles.tree} ${styles.treeRight}`}><span className={styles.treeTrunk} /><span className={styles.treeCrown} /></div>
            <div className={`${styles.tree} ${styles.treeFar}`}><span className={styles.treeTrunk} /><span className={styles.treeCrown} /></div>
            <div className={styles.bench}><span className={styles.benchBack} /><span className={styles.benchSeat} /></div>
            <div className={styles.flowerBed}><span className={styles.flower} /><span className={styles.flower} /><span className={styles.flower} /></div>
            <div className={styles.lamp} />
            {villagers.map((member, index) => <WorldCharacter key={member.id} member={member} index={index} selected={selected?.id === member.id} paused={paused} gathered={gathered} celebrating={celebrating} reducedMotion={shouldReduceMotion} onSelect={() => setSelected(member)} />)}
            {celebrating && CONFETTI.map((piece, index) => <span key={index} className={styles.confetti} style={{ left: piece.left, animationDelay: piece.delay }} />)}
            <span className={styles.sceneLabel}><Church size={15} /> Plaza Shalom</span>
          </section>
        </div>
      )}

      <div className={styles.tips}>
        <div className={styles.tip}><span className={styles.tipIcon}><Hand size={17} /></span><span><strong>Conoce a alguien</strong><p>Toca cualquier personaje para abrir su historia.</p></span></div>
        <div className={styles.tip}><span className={styles.tipIcon}><UsersRound size={17} /></span><span><strong>Reúne la comunidad</strong><p>Haz que todos se acerquen frente a la iglesia.</p></span></div>
        <div className={styles.tip}><span className={styles.tipIcon}><BellRing size={17} /></span><span><strong>Crea un momento</strong><p>Toca las campanas para celebrar juntos.</p></span></div>
      </div>

      <AnimatePresence>
        {selected && <>
          <motion.button className={styles.detailBackdrop} aria-label="Cerrar detalle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} />
          <motion.aside className={styles.detail} initial={{ opacity: 0, x: 35, y: 12 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 35 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <div className={styles.detailTop}>
              <button onClick={() => setSelected(null)} className={styles.detailClose} aria-label="Cerrar"><X size={18} /></button>
              <CommunityCharacter profile={profileFromMember(selected)} size="large" selected className={styles.detailCharacter} />
              <div className={styles.detailIdentity}><small>Habitante de Mundo Shalom</small><h3>{selected.full_name}</h3><p>{selected.ministry || 'Comunidad Shalom'}</p></div>
            </div>
            <div className={styles.detailBody}>
              {selected.bio && <p className={styles.bio}>{selected.bio}</p>}
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}><CalendarDays size={17} /><span><small>Cumpleaños</small>{birthdayLabel(selected.birth_date)}</span></div>
                <div className={styles.detailItem}><MapPin size={17} /><span><small>Su rincón</small>{selected.ministry || 'La plaza'}</span></div>
              </div>
              <button onClick={() => router.push('/integrantes')} className={`secondary-button ${styles.detailAction}`}><BookHeart size={16} /> Ver ficha completa</button>
            </div>
          </motion.aside>
        </>}
      </AnimatePresence>
    </div>
  );
}
