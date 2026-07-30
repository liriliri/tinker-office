import LocalStore from 'licia/LocalStore'
import isObj from 'licia/isObj'
import wordIcon from '../assets/word.svg'
import excelIcon from '../assets/excel.svg'
import pptIcon from '../assets/ppt.svg'
import { docTypeFromExt, type DocType } from '../types'

/** localStorage key used by LocalStore — for cross-window `storage` events. */
export const STORAGE_KEY = 'tinker-office'

export const STORAGE_RECENT = 'recentFiles'

const storage = new LocalStore(STORAGE_KEY)

export default storage

/** Sync in-memory LocalStore from disk after another window updates it. */
export function rehydrateStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      storage.clear()
      return
    }
    const data = JSON.parse(raw)
    if (!isObj(data)) return
    storage.set(data)
  } catch {
    // keep current in-memory state
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await tinker.fstat(filePath)
    return true
  } catch {
    return false
  }
}

export function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
  throw new Error('Unsupported file data type')
}

export interface DocumentTypeConfig {
  type: string
  icon: string
  /** Brand accent for the doc family (Word / Excel / PowerPoint). */
  accent: string
}

const FAMILY: Record<DocType, Pick<DocumentTypeConfig, 'icon' | 'accent'>> = {
  docx: {
    icon: wordIcon,
    accent: '#2b579a',
  },
  xlsx: {
    icon: excelIcon,
    accent: '#217346',
  },
  pptx: {
    icon: pptIcon,
    accent: '#b7472a',
  },
}

export function getDocConfig(type: string): DocumentTypeConfig {
  const normalized = type.toLowerCase().replace(/^\./, '')
  const family = docTypeFromExt(normalized) || 'docx'
  return { type: normalized || family, ...FAMILY[family] }
}
