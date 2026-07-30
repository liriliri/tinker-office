import className from 'licia/className'
import { getDocConfig } from '../lib/documentTypes'

interface DocumentIconProps {
  type: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export default function DocumentIcon({
  type,
  className: classNameProp,
  size = 'md',
}: DocumentIconProps) {
  const config = getDocConfig(type)

  return (
    <img
      src={config.icon}
      alt=""
      draggable={false}
      className={className(
        'shrink-0 object-contain',
        SIZE[size],
        classNameProp,
      )}
    />
  )
}
