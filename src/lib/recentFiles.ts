import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isNum from 'licia/isNum'
import isStr from 'licia/isStr'
import { basename, docTypeFromExt } from '../types'
import storage, { STORAGE_RECENT } from './util'

export interface RecentFileRecord {
  path: string
  name: string
  type: string
  updatedAt: number
}

const MAX_RECENT = 20

function isRecentFileRecord(item: unknown): item is RecentFileRecord {
  if (!item || typeof item !== 'object') return false
  const rec = item as RecentFileRecord
  return (
    isStr(rec.path) &&
    isStr(rec.name) &&
    isStr(rec.type) &&
    isNum(rec.updatedAt)
  )
}

function normalize(list: unknown): RecentFileRecord[] {
  if (!isArr(list)) return []
  return filter(list, isRecentFileRecord) as RecentFileRecord[]
}

function migrateLegacy(): RecentFileRecord[] | null {
  try {
    const raw = localStorage.getItem('tinker-office-recent-files')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    localStorage.removeItem('tinker-office-recent-files')
    const records = normalize(parsed)
    return records.length > 0 ? records : null
  } catch {
    return null
  }
}

function readAll(): RecentFileRecord[] {
  const saved = storage.get(STORAGE_RECENT)
  if (isArr(saved)) return normalize(saved)

  const legacy = migrateLegacy()
  if (legacy) {
    writeAll(legacy)
    return legacy.slice(0, MAX_RECENT)
  }

  return []
}

function writeAll(records: RecentFileRecord[]) {
  storage.set(STORAGE_RECENT, records.slice(0, MAX_RECENT))
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
  const rest = filter(readAll(), (item) => item.path !== filePath)
  const records = [next, ...rest].slice(0, MAX_RECENT)
  writeAll(records)
  return records
}

export function removeRecentFile(filePath: string): RecentFileRecord[] {
  const records = filter(readAll(), (item) => item.path !== filePath)
  writeAll(records)
  return records
}

type RelativeTimeKey =
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
