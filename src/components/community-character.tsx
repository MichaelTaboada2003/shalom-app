import type { AvatarGender, AvatarHairStyle, AvatarSkinTone, AvatarStyle, Member } from '@/lib/community';
import styles from './community-character.module.css';

export interface CharacterProfile {
  id: string;
  name: string;
  avatarStyle: AvatarStyle | string;
  avatarGender: AvatarGender;
  avatarSkinTone: AvatarSkinTone;
  avatarHairStyle: AvatarHairStyle;
}

interface CommunityCharacterProps {
  profile: CharacterProfile;
  size?: 'small' | 'medium' | 'large' | 'hero';
  walking?: boolean;
  selected?: boolean;
  celebrating?: boolean;
  className?: string;
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) - result + value.charCodeAt(index)) | 0;
  return Math.abs(result);
}

export function profileFromMember(member: Member): CharacterProfile {
  return {
    id: member.id,
    name: member.full_name,
    avatarStyle: member.avatar_style,
    avatarGender: member.avatar_gender ?? 'woman',
    avatarSkinTone: member.avatar_skin_tone ?? 'medium',
    avatarHairStyle: member.avatar_hair_style ?? 'waves',
  };
}

export function CommunityCharacter({ profile, size = 'medium', walking = false, selected = false, celebrating = false, className = '' }: CommunityCharacterProps) {
  const seed = hash(profile.id || profile.name);

  return (
    <div
      className={`${styles.character} ${styles[size]} ${walking ? styles.walking : ''} ${selected ? styles.selected : ''} ${celebrating ? styles.celebrating : ''} ${className}`}
      data-skin={profile.avatarSkinTone}
      data-hair={seed % 4}
      data-hair-shape={profile.avatarHairStyle}
      data-gender={profile.avatarGender}
      data-outfit={profile.avatarStyle || 'lilac'}
      aria-hidden="true"
    >
      <span className={styles.shadow} />
      <span className={styles.person}>
        <span className={styles.hairBack} />
        <span className={styles.neck} />
        <span className={`${styles.arm} ${styles.armLeft}`}><span className={styles.hand} /></span>
        <span className={`${styles.arm} ${styles.armRight}`}><span className={styles.hand} /></span>
        <span className={styles.torso}><span className={styles.collar} /><span className={styles.heart} /></span>
        <span className={`${styles.leg} ${styles.legLeft}`}><span className={styles.shoe} /></span>
        <span className={`${styles.leg} ${styles.legRight}`}><span className={styles.shoe} /></span>
        <span className={styles.head}><span className={styles.face}>
          <span className={`${styles.eye} ${styles.eyeLeft}`} />
          <span className={`${styles.eye} ${styles.eyeRight}`} />
          <span className={`${styles.blush} ${styles.blushLeft}`} />
          <span className={`${styles.blush} ${styles.blushRight}`} />
          <span className={styles.mouth} />
        </span></span>
      </span>
      <span className={`${styles.sparkle} ${styles.sparkleOne}`} />
      <span className={`${styles.sparkle} ${styles.sparkleTwo}`} />
    </div>
  );
}
