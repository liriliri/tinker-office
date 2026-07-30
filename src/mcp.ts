import type { Store } from './store'
import { basename } from './types'
import { openEditorWindow } from './lib/editorWindow'
import { addRecentFile } from './lib/recentFiles'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'open_file') {
      return openFile(getStore(), args as { path: string })
    }
    if (name === 'new_document') {
      return newDocument(args as { type: 'docx' | 'xlsx' | 'pptx' })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function openFile(_store: Store, args: { path: string }) {
  const path = args.path.trim()
  addRecentFile(path)
  openEditorWindow({ path })
  return {
    fileName: basename(path),
    path,
    openedInNewWindow: true,
  }
}

async function newDocument(args: { type: 'docx' | 'xlsx' | 'pptx' }) {
  openEditorWindow({ type: args.type })
  return {
    fileName: `Untitled.${args.type}`,
    docType: args.type,
    openedInNewWindow: true,
  }
}
