import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { emptyBin } from '../lib/emptyBin'
import {
  c_oAscFileType2,
  convertBinToDocument,
  convertDocument,
  initX2T,
  initX2TScript,
} from '../lib/x2t'
import store from '../store'
import { toErrorMessage } from '../errorMessage'

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        id: string,
        config: Record<string, unknown>
      ) => {
        destroyEditor: () => void
        sendCommand: (cmd: { command: string; data?: unknown }) => void
      }
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
  const { file, fileName, editorKey, language, theme } = store
  const editorRef = useRef<{
    destroyEditor: () => void
    sendCommand: (cmd: { command: string; data?: unknown }) => void
  } | null>(null)
  const mediaRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const media = mediaRef.current

    async function boot() {
      store.setReady(false)
      store.setError(null)

      try {
        await initX2TScript()
        await loadEditorApi()
        await initX2T()
        if (cancelled) return

        const fileType = fileName.split('.').pop()?.toLowerCase() || 'docx'
        let binData: ArrayBuffer | Uint8Array | string
        let mediaMap: Record<string, string> | undefined

        if (file) {
          const converted = await convertDocument(file)
          if (cancelled) return
          binData = converted.bin
          mediaMap = converted.media
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
              if (mediaMap) {
                editorRef.current.sendCommand({
                  command: 'asc_setImageUrls',
                  data: { urls: mediaMap },
                })
              }
              editorRef.current.sendCommand({
                command: 'asc_openDocument',
                data: { buf: binData },
              })
            },
            onDocumentReady: () => {
              if (cancelled) return
              store.setReady(true)
            },
            onDocumentStateChange: (event: { data?: boolean }) => {
              if (typeof event?.data === 'boolean') {
                store.setDirty(event.data)
              }
            },
            onError: (event: { data?: unknown }) => {
              store.setError(toErrorMessage(event?.data ?? 'Editor error'))
            },
            onSave: async (event: {
              data?: { data?: Uint8Array; option?: { outputformat?: number } }
            }) => {
              try {
                const payload = event?.data
                if (!payload?.data || !editorRef.current) return
                const raw = payload.data
                const bin =
                  raw instanceof Uint8Array
                    ? raw
                    : new Uint8Array(raw as ArrayBuffer)
                const format =
                  c_oAscFileType2[payload.option?.outputformat ?? 0] || 'DOCX'
                const result = await convertBinToDocument(
                  bin,
                  fileName,
                  format
                )
                await store.saveBytes(result.data, result.fileName)
                editorRef.current.sendCommand({
                  command: 'asc_onSaveCallback',
                  data: { err_code: 0 },
                })
              } catch (error) {
                store.setError(toErrorMessage(error))
                editorRef.current?.sendCommand({
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
              try {
                const eventData = event?.data
                if (!eventData?.data || !eventData.file || !editorRef.current) {
                  return
                }
                const imageData = eventData.data
                const imgName = eventData.file
                const ext = imgName.split('.').pop()?.toLowerCase() || 'png'
                const objectUrl = URL.createObjectURL(
                  new Blob([new Uint8Array(imageData)], {
                    type: mimeFromExt(ext),
                  })
                )
                media[`media/${imgName}`] = objectUrl
                editorRef.current.sendCommand({
                  command: 'asc_setImageUrls',
                  data: { urls: media },
                })
                editorRef.current.sendCommand({
                  command: 'asc_writeFileCallback',
                  data: { path: objectUrl, imgName },
                })
              } catch (error) {
                editorRef.current?.sendCommand({
                  command: 'asc_writeFileCallback',
                  data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                  },
                })
              }
            },
          },
        })
      } catch (error) {
        if (!cancelled) store.setError(toErrorMessage(error))
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
  }, [editorKey, file, fileName, language, theme])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div id="oo-placeholder" className="h-full w-full" />
    </div>
  )
})

export default OfficeEditor
