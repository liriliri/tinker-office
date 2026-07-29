import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'open_file') {
      return openFile(getStore(), args as { path: string })
    }
    if (name === 'new_document') {
      return newDocument(getStore(), args as { type: 'docx' | 'xlsx' | 'pptx' })
    }
    return `Error: Unknown tool "${name}"`
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function openFile(store: Store, args: { path: string }) {
  try {
    await store.openPath(args.path.trim())
    return {
      fileName: store.fileName,
      docType: store.docType,
      editorKey: store.editorKey,
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Failed to open file'}`
  }
}

async function newDocument(
  store: Store,
  args: { type: 'docx' | 'xlsx' | 'pptx' }
) {
  store.newDocument(args.type)
  return {
    fileName: store.fileName,
    docType: store.docType,
    editorKey: store.editorKey,
  }
}
