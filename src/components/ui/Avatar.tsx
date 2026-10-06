import { getInitials, getTintIndex } from '../../domain/identity'

type AvatarProps = { name: string; size?: 'sm' | 'md' | 'lg' }

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size}`} data-tint={getTintIndex(name)} aria-hidden="true">
      {getInitials(name)}
    </span>
  )
}
