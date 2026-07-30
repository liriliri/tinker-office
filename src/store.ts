import { makeAutoObservable, runInAction } from 'mobx'
import { basename, type DocType, OFFICE_EXTENSIONS } from './types'
import { createMcpApi } from './mcp'
import {
  addRecentFile,
  getRecentFiles,
  removeRecentFile,
  type RecentFileRecord,
} from './lib/recentFiles'
import {
  ensureTinker,
  getLaunchParams,
  openEditorWindow,
  type LaunchParams,
} from './lib/editorWindow'
import { fileExists, toUint8Array } from './lib/util'

ensureTinker()

type EditorTheme = 'theme-light' | 'theme-dark'
type AppView = 'home' | 'editor'

const launch: LaunchParams | null = getLaunchParams()

export class Store {
  /** MCP is registered only on the home window to avoid multi-window clashes. */
  readonly mcp = launch ? null : createMcpApi(() => this)

  view: AppView = launch ? 'editor' : 'home'
  file: File | null = null
  filePath: string | null = null
  fileName: string = 'Untitled.docx'
  editorKey: number = 0
  language: string = 'en'
  theme: EditorTheme = 'theme-light'
  recentFiles: RecentFileRecord[] = []
  toastOpen = false
  toastMsg = ''

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  get isHomeWindow() {
    return !launch
  }

  async initFromLaunch() {
    if (!launch) return
    try {
      if (launch.mode === 'path') {
        await this.loadPath(launch.path)
      } else {
        this.loadNewDocument(launch.type)
      }
    } catch (error) {
      this.setError(error)
    }
  }

  loadRecentFiles() {
    this.recentFiles = getRecentFiles()
  }

  rememberPath(filePath: string) {
    this.recentFiles = addRecentFile(filePath)
  }

  removeRecent(filePath: string) {
    this.recentFiles = removeRecentFile(filePath)
  }

  setError(error: unknown) {
    if (error == null || error === '') return
    this.toastMsg = error instanceof Error ? error.message : String(error)
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  setLanguage(language: string) {
    this.language =
      language === 'zh-CN' ? 'zh-CN' : language.split('-')[0] || 'en'
  }

  setThemeFromApp(appTheme: string) {
    const next: EditorTheme = appTheme === 'dark' ? 'theme-dark' : 'theme-light'
    if (this.theme === next) return
    this.theme = next
  }

  /** From home: open a new window. From editor: replace current document. */
  newDocument(type: DocType = 'docx') {
    if (this.isHomeWindow) {
      openEditorWindow({ type })
      return
    }
    this.loadNewDocument(type)
  }

  loadNewDocument(type: DocType = 'docx') {
    this.file = null
    this.filePath = null
    this.fileName = `Untitled.${type}`
    this.view = 'editor'
    this.bumpEditor()
  }

  async openPath(filePath: string) {
    if (!(await fileExists(filePath))) {
      throw new Error(`File not found: ${filePath}`)
    }
    if (this.isHomeWindow) {
      this.rememberPath(filePath)
      openEditorWindow({ path: filePath })
      return
    }
    await this.loadPath(filePath)
  }

  async loadPath(filePath: string) {
    const data = await tinker.readFile(filePath)
    const name = basename(filePath)
    const bytes = toUint8Array(data)
    const file = new File([bytes.slice()], name)

    runInAction(() => {
      this.file = file
      this.filePath = filePath
      this.fileName = name
      this.view = 'editor'
      this.bumpEditor()
      this.rememberPath(filePath)
    })
  }

  async openRecent(record: RecentFileRecord) {
    try {
      await this.openPath(record.path)
    } catch (error) {
      this.removeRecent(record.path)
      this.setError(error)
    }
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
      this.setError(error)
    }
  }

  async saveBytes(bytes: Uint8Array, filename: string) {
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

    await tinker.writeFile(result.filePath, bytes)
    runInAction(() => {
      this.filePath = result.filePath!
      this.fileName = basename(result.filePath!)
      this.rememberPath(result.filePath!)
    })
  }

  private bumpEditor() {
    this.editorKey += 1
  }
}

const store = new Store()

export default store
