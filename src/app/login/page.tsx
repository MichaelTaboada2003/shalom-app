'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, HeartHandshake, Lock, LogIn, Mail, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import logoShalom from '@/app/assets/logo-shalom.png';
import { CommunityCharacter, type CharacterProfile } from '@/components/community-character';
import styles from './login.module.css';

const welcomeCharacters: CharacterProfile[] = [
  { id: 'login-ana', name: 'Ana', avatarStyle: 'lilac', avatarGender: 'woman', avatarSkinTone: 'medium', avatarHairStyle: 'waves' },
  { id: 'login-camila', name: 'Camila', avatarStyle: 'mint', avatarGender: 'woman', avatarSkinTone: 'deep', avatarHairStyle: 'braids' },
  { id: 'login-samuel', name: 'Samuel', avatarStyle: 'sky', avatarGender: 'man', avatarSkinTone: 'tan', avatarHairStyle: 'curls' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    else router.push('/checklist');
  };
  return (
    <div className={styles.page}>
      <section className={styles.story} aria-label="Bienvenida a Shalom">
        <div className={styles.storyContent}>
          <div className={styles.eyebrow}><HeartHandshake size={14} /> Comunidad que se siente cerca</div>
          <h1>Organiza, cuida y celebra a <span>tu comunidad.</span></h1>
          <p>Todo lo importante de Shalom en un mismo lugar: personas, cumpleaños, retiros y un pequeño mundo lleno de vida.</p>
          <div className={styles.features}><span className={styles.feature}><UsersRound size={15} /> Perfiles con historia</span><span className={styles.feature}><Sparkles size={15} /> Mundo interactivo</span><span className={styles.feature}><ShieldCheck size={15} /> Acceso por roles</span></div>
          <div className={styles.characters} aria-hidden="true">{welcomeCharacters.map(profile => <CommunityCharacter key={profile.id} profile={profile} size="hero" />)}</div>
        </div>
      </section>
      <main className={styles.loginSide}>
        <motion.div className={styles.loginCard} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, ease: 'easeOut' }}>
          <div className={styles.logoRow}><Image src={logoShalom} alt="Logo de Shalom" width={58} height={58} priority className={styles.logo} /><div><h2>Shalom</h2><p>Comunidad viva</p></div></div>
          <div className={styles.welcome}><h1>Qué alegría verte</h1><p>Inicia sesión para volver a conectar con todo lo que están construyendo juntos.</p></div>
          {error && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={styles.error}><AlertCircle size={16} />{error}</motion.div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>Correo electrónico<span className={styles.inputWrap}><Mail size={16} /><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required /></span></label>
            <label className={styles.field}>Contraseña<span className={styles.inputWrap}><Lock size={16} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Tu contraseña" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(current => !current)} className={styles.passwordToggle} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <button type="submit" disabled={submitting} className={styles.submit}>{submitting ? <span className={styles.spinner} /> : <><LogIn size={17} /> Entrar a Shalom</>}</button>
          </form>
          <p className={styles.safe}><ShieldCheck size={12} /> Tus datos viajan protegidos y tu sesión es privada.</p>
        </motion.div>
      </main>
    </div>
  );
}
