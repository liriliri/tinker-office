import type { DocType } from '../types'
import { basename } from '../types'

export type LaunchParams =
  { mode: 'path'; path: string } | { mode: 'new'; type: DocType }

export function getLaunchParams(): LaunchParams | null {
  const params = new URLSearchParams(window.location.search)
  const path = params.get('path')
  if (path) return { mode: 'path', path }

  const type = params.get('new')
  if (type === 'docx' || type === 'xlsx' || type === 'pptx') {
    return { mode: 'new', type }
  }
  return null
}

export function openEditorWindow(
  target: { path: string } | { type: DocType },
): void {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  if ('path' in target) {
    url.searchParams.set('path', target.path)
  } else {
    url.searchParams.set('new', target.type)
    // Blank docs share `?new=docx`; a unique id keeps each one a new window.
    url.searchParams.set('id', String(Date.now()))
  }

  const features = [
    'width=1280',
    'height=860',
    'minWidth=800',
    'minHeight=600',
    'resizable=yes',
    'frame=no',
  ].join(',')

  // _blank: a named target navigates (reloads) an existing window. The host
  // focuses a child that is already on this exact plugin:// URL.
  const popup = window.open(url.href, '_blank', features)
  if (!popup) {
    throw new Error('Failed to open editor window (popup blocked?)')
  }
}

/** Ensure a File has a filesystem path (write temp copy if needed). */
export async function resolveFilePath(file: File): Promise<string> {
  const existing = tinker.getPathForFile(file)
  if (existing) return existing

  const tempDir = await tinker.getPath('temp')
  const safeName =
    basename(file.name).replace(/[/?<>\\:*|"]/g, '_') || 'document.bin'
  const dest = `${tempDir}/tinker-office-${Date.now()}-${safeName}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  await tinker.writeFile(dest, bytes)
  return dest
}
