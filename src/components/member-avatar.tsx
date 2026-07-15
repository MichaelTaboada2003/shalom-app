'use client';

import { useState } from 'react';
import { getInitials, type AvatarStyle } from '@/lib/community';

interface MemberAvatarProps {
  name: string;
  imageUrl?: string | null;
  style?: AvatarStyle | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
};

export function MemberAvatar({ name, imageUrl, style = 'lilac', size = 'md', className = '' }: MemberAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div
      className={`member-avatar member-avatar-${style} ${SIZES[size]} ${className}`}
      aria-label={`Avatar de ${name}`}
      role="img"
    >
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
