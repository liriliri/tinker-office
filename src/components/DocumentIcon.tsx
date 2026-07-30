import className from 'licia/className'
import { getDocConfig } from '../lib/util'

interface DocumentIconProps {
  type: string
  className?: string
  size?: 'sm' | 'md'
}

const SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
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
