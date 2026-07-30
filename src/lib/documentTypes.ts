import wordIcon from '../assets/word.svg'
import excelIcon from '../assets/excel.svg'
import pptIcon from '../assets/ppt.svg'
import { docTypeFromExt, type DocType } from '../types'

export interface DocumentTypeConfig {
  type: string
  icon: string
  hoverBorderColor: string
}

const FAMILY: Record<
  DocType,
  Pick<DocumentTypeConfig, 'icon' | 'hoverBorderColor'>
> = {
  docx: {
    icon: wordIcon,
    hoverBorderColor: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  xlsx: {
    icon: excelIcon,
    hoverBorderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  pptx: {
    icon: pptIcon,
    hoverBorderColor: 'hover:border-orange-300 dark:hover:border-orange-700',
  },
}

export function getDocConfig(type: string): DocumentTypeConfig {
  const normalized = type.toLowerCase().replace(/^\./, '')
  const family = docTypeFromExt(normalized) || 'docx'
  return { type: normalized || family, ...FAMILY[family] }
}
