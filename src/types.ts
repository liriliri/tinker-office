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
] as const

const EXT_TO_DOC_TYPE: Record<string, DocType> = {
  docx: 'docx',
  doc: 'docx',
  odt: 'docx',
  rtf: 'docx',
  txt: 'docx',
  xlsx: 'xlsx',
  xls: 'xlsx',
  ods: 'xlsx',
  csv: 'xlsx',
  pptx: 'pptx',
  ppt: 'pptx',
  odp: 'pptx',
}

export function docTypeFromExt(ext: string): DocType | undefined {
  return EXT_TO_DOC_TYPE[ext.toLowerCase()]
}

export function basename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] || filePath
}
