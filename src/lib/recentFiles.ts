import type { DocType } from '../types'
import { basename, docTypeFromExt } from '../types'

export interface RecentFileRecord {
  path: string
  name: string
  type: string
  updatedAt: number
}

const STORAGE_KEY = 'tinker-office-recent-files'
const MAX_RECENT = 20

export { STORAGE_KEY }

function readAll(): RecentFileRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentFileRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.path === 'string' &&
        typeof item.name === 'string' &&
        typeof item.updatedAt === 'number',
    )
  } catch {
    return []
  }
}

function writeAll(records: RecentFileRecord[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records.slice(0, MAX_RECENT)),
  )
}

export function getRecentFiles(): RecentFileRecord[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function addRecentFile(filePath: string): RecentFileRecord[] {
  const name = basename(filePath)
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const type = docTypeFromExt(ext) || ext || 'docx'
  const next: RecentFileRecord = {
    path: filePath,
    name,
    type,
    updatedAt: Date.now(),
  }
  const rest = readAll().filter((item) => item.path !== filePath)
  const records = [next, ...rest].slice(0, MAX_RECENT)
  writeAll(records)
  return records
}

export function removeRecentFile(filePath: string): RecentFileRecord[] {
  const records = readAll().filter((item) => item.path !== filePath)
  writeAll(records)
  return records
}

export function clearRecentFiles(): RecentFileRecord[] {
  writeAll([])
  return []
}

export type RelativeTimeKey =
  | 'timeJustNow'
  | 'timeMinutesAgo'
  | 'timeHoursAgo'
  | 'timeDaysAgo'
  | 'timeWeeksAgo'

export function getRelativeTime(
  timestamp: number,
): { key: RelativeTimeKey; count?: number } | { date: string } {
  if (!timestamp) return { date: '' }
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)

  if (minutes < 1) return { key: 'timeJustNow' }
  if (minutes < 60) return { key: 'timeMinutesAgo', count: minutes }
  if (hours < 24) return { key: 'timeHoursAgo', count: hours }
  if (days < 7) return { key: 'timeDaysAgo', count: days }
  if (weeks < 4) return { key: 'timeWeeksAgo', count: weeks }
  return { date: new Date(timestamp).toLocaleDateString() }
}
