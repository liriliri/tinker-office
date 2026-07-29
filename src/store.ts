import { makeAutoObservable, runInAction } from 'mobx'
import type { OfficeTheme } from 'wasm-onlyoffice-sdk'
import { toErrorMessage } from './errorMessage'
import { basename, type DocType, OFFICE_EXTENSIONS } from './types'
import { createMcpApi } from './mcp'

function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
  throw new Error('Unsupported file data type')
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  file: File | null = null
  filePath: string | null = null
  fileName: string = 'Untitled.docx'
  docType: DocType = 'docx'
  isDirty: boolean = false
  editorKey: number = 0
  ready: boolean = false
  error: string | null = null
  language: string = 'en'
  theme: OfficeTheme = 'theme-light'

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  setDirty(isDirty: boolean) {
    this.isDirty = isDirty
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  setError(error: string | null) {
    this.error = error
  }

  setLanguage(language: string) {
    this.language =
      language === 'zh-CN' ? 'zh-CN' : language.split('-')[0] || 'en'
  }

  setThemeFromApp(appTheme: string) {
    const next = appTheme === 'dark' ? 'theme-dark' : 'theme-light'
    if (this.theme === next) return
    this.theme = next
    this.bumpEditor()
  }

  newDocument(type: DocType = 'docx') {
    this.file = null
    this.filePath = null
    this.docType = type
    this.fileName = `Untitled.${type}`
    this.isDirty = false
    this.ready = false
    this.error = null
    this.bumpEditor()
  }

  openFile(file: File, filePath?: string | null) {
    this.file = file
    this.filePath = filePath || null
    this.fileName = file.name
    this.isDirty = false
    this.ready = false
    this.error = null
    this.bumpEditor()
  }

  async openPath(filePath: string) {
    const data = await tinker.readFile(filePath)
    const name = basename(filePath)
    const bytes = toUint8Array(data)
    const file = new File([bytes], name)
    this.openFile(file, filePath)
  }

  async pickAndOpen() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Office Documents',
          extensions: [...OFFICE_EXTENSIONS],
        },
      ],
    })
    if (result.canceled || !result.filePaths[0]) return
    try {
      await this.openPath(result.filePaths[0])
    } catch (error) {
      runInAction(() => {
        this.error = toErrorMessage(error)
      })
    }
  }

  async saveBlob(blob: Blob, filename: string) {
    const defaultPath = this.filePath || filename
    const result = await tinker.showSaveDialog({
      defaultPath,
      filters: [
        {
          name: 'Office Documents',
          extensions: [...OFFICE_EXTENSIONS],
        },
      ],
    })
    if (result.canceled || !result.filePath) return

    const bytes = new Uint8Array(await blob.arrayBuffer())
    await tinker.writeFile(result.filePath, bytes)
    runInAction(() => {
      this.filePath = result.filePath!
      this.fileName = basename(result.filePath!)
      this.isDirty = false
    })
  }

  private bumpEditor() {
    this.editorKey += 1
  }
}

const store = new Store()

export default store
