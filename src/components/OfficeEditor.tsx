import { useEffect, useRef, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { X } from 'lucide-react'
import { emptyBin } from '../lib/emptyBin'
import {
  convertBinToDocument,
  convertDocument,
  initX2T,
  resolveSaveFormat,
} from '../lib/x2t'
import store from '../store'
import { tw } from '../theme'

const DRAG_STRIP_STYLE = {
  left: 260,
  right: 120,
  WebkitAppRegion: 'drag',
} as CSSProperties

const NO_DRAG_STYLE = { WebkitAppRegion: 'no-drag' } as CSSProperties

/** Make OnlyOffice's own header a frameless drag region (iframe CSS). */
function injectTitlebarDragCss() {
  const iframe = document.querySelector<HTMLIFrameElement>(
    'iframe[name="frameEditor"]',
  )
  const doc = iframe?.contentDocument
  if (!doc?.head || doc.getElementById('tinker-office-drag-style')) return

  const style = doc.createElement('style')
  style.id = 'tinker-office-drag-style'
  style.textContent = `
    #box-document-title {
      -webkit-app-region: drag;
    }
    #box-document-title button,
    #box-document-title .btn-slot,
    #box-document-title a,
    #box-document-title input,
    #box-document-title #header-logo,
    #box-document-title label,
    #box-document-title [role="button"] {
      -webkit-app-region: no-drag;
    }
  `
  doc.head.appendChild(style)
}

type DocEditor = {
  destroyEditor: () => void
  sendCommand: (cmd: { command: string; data?: unknown }) => void
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: Record<string, unknown>) => DocEditor
    }
  }
}

function loadEditorApi(): Promise<void> {
  if (window.DocsAPI) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = './web-apps/apps/api/documents/api.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load OnlyOffice API'))
    document.head.appendChild(script)
  })
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return map[ext.toLowerCase()] || 'image/png'
}

const OfficeEditor = observer(function OfficeEditor() {
  const { t } = useTranslation()
  const { file, fileName, editorKey, language, theme } = store
  const editorRef = useRef<DocEditor | null>(null)
  const mediaRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const media = mediaRef.current

    async function boot() {
      try {
        await Promise.all([loadEditorApi(), initX2T()])
        if (cancelled) return

        const fileType = fileName.split('.').pop()?.toLowerCase() || 'docx'
        let binData: ArrayBuffer | Uint8Array | string

        if (file) {
          const converted = await convertDocument(file)
          if (cancelled) return
          binData = converted.bin
          Object.assign(media, converted.media)
        } else {
          const template = emptyBin[`.${fileType}`]
          if (!template) throw new Error(`Unsupported file type: ${fileType}`)
          binData = template
        }

        if (editorRef.current) {
          editorRef.current.destroyEditor()
          editorRef.current = null
        }

        const placeholder = document.getElementById('oo-placeholder')
        if (placeholder) placeholder.innerHTML = ''

        const lang = language.startsWith('zh') ? 'zh' : 'en'
        const uitheme = theme === 'theme-dark' ? 'theme-dark' : 'theme-light'

        editorRef.current = new window.DocsAPI!.DocEditor('oo-placeholder', {
          document: {
            title: fileName,
            url: fileName,
            fileType,
            permissions: {
              edit: true,
              chat: false,
              protect: false,
            },
          },
          editorConfig: {
            lang,
            customization: {
              help: false,
              about: false,
              hideRightMenu: true,
              uiTheme: uitheme,
              features: {
                spellcheck: { change: false },
              },
              anonymous: {
                request: false,
                label: 'Guest',
              },
            },
          },
          events: {
            onAppReady: () => {
              if (cancelled || !editorRef.current) return
              injectTitlebarDragCss()
              // Title DOM can lag slightly behind app-ready
              requestAnimationFrame(injectTitlebarDragCss)
              if (Object.keys(media).length > 0) {
                editorRef.current.sendCommand({
                  command: 'asc_setImageUrls',
                  data: { urls: media },
                })
              }
              editorRef.current.sendCommand({
                command: 'asc_openDocument',
                data: { buf: binData },
              })
            },
            // Mirrors onlyoffice-web-local DocumentHandler.handleSaveDocument
            onSave: async (event: {
              data?: {
                data?: { data?: string | Uint8Array }
                option?: { outputformat?: number }
              }
            }) => {
              const editor = editorRef.current
              try {
                const { data, option } = event?.data ?? {}
                if (data?.data) {
                  const format = resolveSaveFormat(
                    option?.outputformat,
                    fileName,
                  )
                  const result = await convertBinToDocument(
                    data.data,
                    fileName,
                    format,
                  )
                  await store.saveBytes(result.data, result.fileName)
                }
                editor?.sendCommand({
                  command: 'asc_onSaveCallback',
                  data: { err_code: 0 },
                })
              } catch (error) {
                store.setError(error)
                editor?.sendCommand({
                  command: 'asc_onSaveCallback',
                  data: { err_code: 1 },
                })
              }
            },
            writeFile: (event: {
              data?: {
                data?: Uint8Array
                file?: string
              }
            }) => {
              const editor = editorRef.current
              try {
                const eventData = event?.data
                if (!eventData?.data || !eventData.file || !editor) return
                const imgName = eventData.file
                const ext = imgName.split('.').pop()?.toLowerCase() || 'png'
                const objectUrl = URL.createObjectURL(
                  new Blob([new Uint8Array(eventData.data)], {
                    type: mimeFromExt(ext),
                  }),
                )
                media[`media/${imgName}`] = objectUrl
                editor.sendCommand({
                  command: 'asc_setImageUrls',
                  data: { urls: media },
                })
                editor.sendCommand({
                  command: 'asc_writeFileCallback',
                  data: { path: objectUrl, imgName },
                })
              } catch (error) {
                editor?.sendCommand({
                  command: 'asc_writeFileCallback',
                  data: {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                })
              }
            },
          },
        })
      } catch (error) {
        if (!cancelled) store.setError(error)
      }
    }

    void boot()

    return () => {
      cancelled = true
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor()
        } catch {
          // ignore
        }
        editorRef.current = null
      }
      for (const url of Object.values(mediaRef.current)) {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      }
      mediaRef.current = {}
    }
    // fileName omitted: saveBytes updates it after save-as and must not remount
  }, [editorKey, file, language, theme])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div id="oo-placeholder" className="h-full w-full" />
      {/* Fallback drag strip: iframe -webkit-app-region is unreliable in Electron. */}
      <div
        aria-hidden
        className="absolute top-0 z-40 h-7"
        style={DRAG_STRIP_STYLE}
      />
      <button
        type="button"
        title={t('close')}
        onClick={() => window.close()}
        className={className(
          'absolute top-1 right-1.5 z-50 inline-flex h-5 w-5 items-center justify-center rounded transition-colors',
          tw.editor.closeBtn,
        )}
        style={NO_DRAG_STYLE}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
})

export default OfficeEditor
