import { getInitials, type AvatarStyle } from '@/lib/community';

interface MemberAvatarProps {
  name: string;
  style?: AvatarStyle | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
};

export function MemberAvatar({ name, style = 'lilac', size = 'md', className = '' }: MemberAvatarProps) {
  return (
    <div
      className={`member-avatar member-avatar-${style} ${SIZES[size]} ${className}`}
      aria-label={`Avatar de ${name}`}
      role="img"
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}
