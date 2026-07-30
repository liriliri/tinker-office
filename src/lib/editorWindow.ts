import type { DocType } from '../types'
import { basename } from '../types'

export type LaunchParams =
  { mode: 'path'; path: string } | { mode: 'new'; type: DocType }

declare global {
  interface Window {
    tinker: typeof tinker
    __OFFICE_LAUNCH__?: LaunchParams
  }
}

/**
 * Child windows from window.open have no plugin preload.
 * Copy tinker from the opener (or top) before any tinker.* call.
 */
export function ensureTinker(): void {
  const w = window as Window & { tinker?: typeof tinker }
  if (w.tinker) return
  try {
    const parent = (window.opener ||
      (window.top !== window ? window.top : null)) as Window | null
    if (parent?.tinker) {
      w.tinker = parent.tinker
    }
  } catch {
    // ignore cross-origin
  }
}

ensureTinker()

export function getLaunchParams(): LaunchParams | null {
  if (window.__OFFICE_LAUNCH__) return window.__OFFICE_LAUNCH__

  const params = new URLSearchParams(window.location.search)
  const path = params.get('path')
  if (path) return { mode: 'path', path }

  const type = params.get('new')
  if (type === 'docx' || type === 'xlsx' || type === 'pptx') {
    return { mode: 'new', type }
  }
  return null
}

function buildWindowName(target: { path: string } | { type: DocType }) {
  if ('path' in target) return `office-path:${target.path}`
  return `office-new:${target.type}:${Date.now()}`
}

/** Open (or focus) an editor window for a path or blank document. */
export function openEditorWindow(
  target: { path: string } | { type: DocType },
): Window {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  if ('path' in target) {
    url.searchParams.set('path', target.path)
  } else {
    url.searchParams.set('new', target.type)
  }

  const features = [
    'width=1280',
    'height=860',
    'minWidth=800',
    'minHeight=600',
    'resizable=yes',
    'frame=no',
  ].join(',')

  const popup = window.open(url.toString(), buildWindowName(target), features)
  if (!popup) {
    throw new Error('Failed to open editor window (popup blocked?)')
  }

  // Best-effort: set before/while navigation (page will also pull from opener).
  try {
    popup.tinker = tinker
    popup.__OFFICE_LAUNCH__ =
      'path' in target
        ? { mode: 'path', path: target.path }
        : { mode: 'new', type: target.type }
  } catch {
    // navigating window may throw
  }

  popup.focus()
  return popup
}

/** Ensure a File has a filesystem path (write temp copy if needed). */
export async function resolveFilePath(file: File): Promise<string> {
  ensureTinker()
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
