import type { Store } from './store'
import { basename, type DocType } from './types'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    const store = getStore()
    switch (name) {
      case 'open_file':
        return openFile(store, args as { path: string })
      case 'new_document':
        return newDocument(store, args as { type: DocType })
      default:
        throw new Error(`Unknown tool "${name}"`)
    }
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function openFile(store: Store, args: { path: string }) {
  const path = args.path.trim()
  await store.openPath(path)
  return {
    fileName: basename(path),
    path,
    openedInNewWindow: store.isHomeWindow,
  }
}

function newDocument(store: Store, args: { type: DocType }) {
  store.newDocument(args.type)
  return {
    fileName: `Untitled.${args.type}`,
    docType: args.type,
    openedInNewWindow: store.isHomeWindow,
  }
}
