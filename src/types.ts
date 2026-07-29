export type DocType = 'docx' | 'xlsx' | 'pptx'

export const OFFICE_EXTENSIONS = [
  'docx',
  'doc',
  'odt',
  'rtf',
  'txt',
  'xlsx',
  'xls',
  'ods',
  'csv',
  'pptx',
  'ppt',
  'odp',
  'pdf',
] as const

export function basename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] || filePath
}

export function extname(filePath: string): string {
  const name = basename(filePath)
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}
