import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Clock, FolderOpen, Upload, X } from 'lucide-react'
import AppScrollArea from './AppScrollArea'
import DocumentIcon from './DocumentIcon'
import { getDocConfig } from '../lib/documentTypes'
import {
  getRelativeTime,
  type RecentFileRecord,
  STORAGE_KEY,
} from '../lib/recentFiles'
import { resolveFilePath } from '../lib/editorWindow'
import { initX2TScript } from '../lib/x2t'
import type { DocType } from '../types'
import store from '../store'
import { tw } from '../theme'

const NEW_TYPES: { type: DocType; labelKey: string }[] = [
  { type: 'docx', labelKey: 'docDocument' },
  { type: 'xlsx', labelKey: 'docSpreadsheet' },
  { type: 'pptx', labelKey: 'docPresentation' },
]

function formatRecentTime(
  t: (key: string, opts?: Record<string, unknown>) => string,
  updatedAt: number,
) {
  const rel = getRelativeTime(updatedAt)
  if ('date' in rel) return rel.date || t('timeUnknown')
  if (rel.key === 'timeJustNow') return t(rel.key)
  return t(rel.key, { count: rel.count })
}

const HomeView = observer(function HomeView() {
  const { t } = useTranslation()
  const { recentFiles } = store
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    store.loadRecentFiles()
    void initX2TScript()
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) store.loadRecentFiles()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const openDroppedFile = async (file: File) => {
    try {
      const path = await resolveFilePath(file)
      await store.openPath(path)
    } catch (error) {
      store.setError(error)
    }
  }

  return (
    <AppScrollArea className={tw.background.primary}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
        <header className="space-y-1">
          <h1
            className={className(
              'text-2xl font-bold tracking-tight',
              tw.text.primary,
            )}
          >
            {t('homeTitle')}
          </h1>
          <p className={className('text-sm', tw.text.tertiary)}>
            {t('homeSubtitle')}
          </p>
        </header>

        <section>
          <button
            type="button"
            onClick={() => store.pickAndOpen()}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) void openDroppedFile(file)
            }}
            className={className(
              'group flex w-full flex-col items-center justify-center rounded-2xl border-[3px] border-dashed px-6 py-8 transition-all duration-200',
              dragOver
                ? 'scale-[1.01] border-[#0066cc] bg-[#0066cc]/15'
                : className(
                    'border-[#0066cc]/30 hover:border-[#0066cc]/60',
                    'bg-gradient-to-br from-[#0066cc]/5 to-[#0066cc]/10',
                    'dark:from-[#0078d4]/10 dark:to-[#0078d4]/5',
                  ),
            )}
          >
            <div
              className={className(
                'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200',
                dragOver
                  ? 'scale-110 bg-[#0066cc]'
                  : 'bg-[#0066cc]/10 group-hover:scale-105 group-hover:bg-[#0066cc]',
              )}
            >
              <Upload
                size={28}
                strokeWidth={2}
                className={className(
                  dragOver
                    ? 'text-white'
                    : 'text-[#0066cc] group-hover:text-white',
                )}
              />
            </div>
            <h2
              className={className('mb-1 text-base font-bold', tw.text.primary)}
            >
              {dragOver ? t('dropFileHere') : t('chooseFile')}
            </h2>
            <p
              className={className(
                'max-w-md text-center text-xs leading-relaxed',
                tw.text.tertiary,
              )}
            >
              {t('chooseFileHint')}
            </p>
            <p className={className('mt-2 text-[10px]', tw.text.quaternary)}>
              {t('supportedFormats')}
            </p>
          </button>
        </section>

        <section>
          <h2 className={className('mb-4 text-lg font-bold', tw.text.primary)}>
            {t('newSection')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {NEW_TYPES.map(({ type, labelKey }) => {
              const doc = getDocConfig(type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => store.newDocument(type)}
                  className={className(
                    'group flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md',
                    tw.background.surface,
                    tw.border.secondary,
                    doc.hoverBorderColor,
                  )}
                >
                  <DocumentIcon type={type} />
                  <span
                    className={className(
                      'text-xs font-semibold transition-colors',
                      tw.text.tertiary,
                      'group-hover:text-[#333] dark:group-hover:text-[#eee]',
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className={className('mb-4 text-lg font-bold', tw.text.primary)}>
            {t('recentSection')}
          </h2>
          {recentFiles.length === 0 ? (
            <div
              className={className(
                'flex flex-col items-center justify-center rounded-xl border px-6 py-12',
                tw.background.surface,
                tw.border.secondary,
              )}
            >
              <FolderOpen
                size={40}
                strokeWidth={1.5}
                className={className('mb-3 opacity-40', tw.text.quaternary)}
              />
              <p
                className={className(
                  'mb-1 text-sm font-medium',
                  tw.text.secondary,
                )}
              >
                {t('noRecentFiles')}
              </p>
              <p className={className('text-xs', tw.text.quaternary)}>
                {t('noRecentFilesHint')}
              </p>
            </div>
          ) : (
            <div
              className={className(
                'overflow-hidden rounded-xl border',
                tw.background.surface,
                tw.border.secondary,
              )}
            >
              {recentFiles.map((file: RecentFileRecord) => (
                <div
                  key={file.path}
                  role="button"
                  tabIndex={0}
                  title={file.path}
                  onClick={() => store.openRecent(file)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      void store.openRecent(file)
                    }
                  }}
                  className={className(
                    'group flex w-full cursor-pointer items-center justify-between border-b px-4 py-3.5 transition-colors last:border-0',
                    tw.border.secondary,
                    'hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a2a]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <DocumentIcon type={file.type} size="sm" />
                    <div className="min-w-0 text-left">
                      <p
                        className={className(
                          'truncate text-sm font-semibold',
                          tw.text.primary,
                        )}
                      >
                        {file.name}
                      </p>
                      <p
                        className={className(
                          'flex items-center gap-1 truncate text-[10px]',
                          tw.text.quaternary,
                        )}
                      >
                        <Clock size={10} />
                        {formatRecentTime(t, file.updatedAt)}
                        <span className="mx-1 opacity-40">·</span>
                        <span className="truncate">{file.path}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title={t('removeRecent')}
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeRecent(file.path)
                    }}
                    className={className(
                      'shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
                      'hover:bg-[#ddd]/60 dark:hover:bg-[#444]',
                    )}
                  >
                    <X size={16} className={tw.text.quaternary} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppScrollArea>
  )
})

export default HomeView
