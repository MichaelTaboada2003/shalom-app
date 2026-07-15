'use client';

import { useState } from 'react';
import type { AvatarStyle, Member } from '@/lib/community';
import styles from './community-character.module.css';

export interface CharacterProfile {
  id: string;
  name: string;
  avatarStyle: AvatarStyle | string;
  avatarUrl?: string | null;
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
  return { id: member.id, name: member.full_name, avatarStyle: member.avatar_style, avatarUrl: member.avatar_url };
}

export function CommunityCharacter({ profile, size = 'medium', walking = false, selected = false, celebrating = false, className = '' }: CommunityCharacterProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const seed = hash(profile.id || profile.name);
  const skin = seed % 4;
  const hair = Math.floor(seed / 5) % 4;
  const hairShape = ['waves', 'bun', 'short', 'side'][Math.floor(seed / 11) % 4];
  const showImage = Boolean(profile.avatarUrl && !imageFailed);

  return (
    <div
      className={`${styles.character} ${styles[size]} ${walking ? styles.walking : ''} ${selected ? styles.selected : ''} ${celebrating ? styles.celebrating : ''} ${className}`}
      data-skin={skin}
      data-hair={hair}
      data-hair-shape={hairShape}
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
        <span className={styles.head}>
          {showImage ? (
            // Arbitrary user-provided avatar hosts cannot be declared in next/image remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl ?? ''} alt="" className={styles.avatarImage} onError={() => setImageFailed(true)} />
          ) : (
            <span className={styles.face}>
              <span className={`${styles.eye} ${styles.eyeLeft}`} />
              <span className={`${styles.eye} ${styles.eyeRight}`} />
              <span className={`${styles.blush} ${styles.blushLeft}`} />
              <span className={`${styles.blush} ${styles.blushRight}`} />
              <span className={styles.mouth} />
            </span>
          )}
        </span>
      </span>
      <span className={`${styles.sparkle} ${styles.sparkleOne}`} />
      <span className={`${styles.sparkle} ${styles.sparkleTwo}`} />
    </div>
  );
}
