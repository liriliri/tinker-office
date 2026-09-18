import { useEffect, useState, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { FolderOpen, X } from 'lucide-react'
import AppScrollArea from './AppScrollArea'
import DocumentIcon from './DocumentIcon'
import { getRelativeTime, type RecentFileRecord } from '../lib/recentFiles'
import { getDocConfig, rehydrateStorage, STORAGE_KEY } from '../lib/util'
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

function accentBarStyle(color: string): CSSProperties {
  return { backgroundColor: color }
}

const HomeView = observer(function HomeView() {
  const { t } = useTranslation()
  const { recentFiles } = store
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    store.loadRecentFiles()
    void initX2TScript()
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        rehydrateStorage()
        store.loadRecentFiles()
      }
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
    <div
      className={className(
        'flex h-full min-h-0 flex-col',
        tw.background.primary,
        dragOver && className('ring-2 ring-inset', tw.accent.ring),
      )}
      onDragEnter={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) void openDroppedFile(file)
      }}
    >
      <div className="flex min-h-0 flex-1">
        <aside
          className={className(
            'flex w-[200px] shrink-0 flex-col border-r',
            tw.background.rail,
            tw.border.secondary,
          )}
        >
          <div className="px-4 pb-3 pt-4">
            <h1
              className={className(
                'text-[15px] font-semibold tracking-tight',
                tw.text.primary,
              )}
            >
              {t('homeTitle')}
            </h1>
          </div>

          <div className="px-2">
            <p
              className={className(
                'px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide',
                tw.text.quaternary,
              )}
            >
              {t('newSection')}
            </p>
            <nav className="flex flex-col gap-0.5">
              {NEW_TYPES.map(({ type, labelKey }) => {
                const { accent } = getDocConfig(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => store.newDocument(type)}
                    className={className(
                      'group flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-left transition-colors',
                      tw.hover.railItem,
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
                      tw.accent.outline,
                    )}
                  >
                    <span
                      className="h-7 w-0.5 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={accentBarStyle(accent)}
                      aria-hidden
                    />
                    <DocumentIcon type={type} size="sm" className="!h-7 !w-7" />
                    <span
                      className={className(
                        'text-[13px] leading-tight',
                        tw.text.secondary,
                      )}
                    >
                      {t(labelKey)}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div
            className={className('mx-4 my-3 border-t', tw.border.secondary)}
          />

          <div className="px-2">
            <button
              type="button"
              onClick={() => store.pickAndOpen()}
              className={className(
                'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left transition-colors',
                tw.hover.railItem,
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
                tw.accent.outline,
              )}
            >
              <FolderOpen
                size={16}
                strokeWidth={1.75}
                className={className('ml-0.5 shrink-0', tw.accent.text)}
              />
              <span
                className={className(
                  'text-[13px] font-medium',
                  tw.text.primary,
                )}
              >
                {t('openFile')}
              </span>
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={className(
              'flex h-10 shrink-0 items-center border-b px-4',
              tw.border.secondary,
              tw.background.surface,
            )}
          >
            <h2
              className={className(
                'text-[13px] font-semibold',
                tw.text.primary,
              )}
            >
              {t('recentSection')}
            </h2>
            {recentFiles.length > 0 && (
              <span
                className={className('ml-2 text-[11px]', tw.text.quaternary)}
              >
                {recentFiles.length}
              </span>
            )}
          </header>

          {recentFiles.length === 0 ? (
            <div
              className={className(
                'flex flex-1 flex-col items-center justify-center gap-1 px-6',
                tw.background.surface,
              )}
            >
              <FolderOpen
                size={28}
                strokeWidth={1.25}
                className={className('mb-1 opacity-35', tw.text.quaternary)}
              />
              <p className={className('text-[13px]', tw.text.secondary)}>
                {t('noRecentFiles')}
              </p>
              <p className={className('text-[11px]', tw.text.quaternary)}>
                {t('noRecentFilesHint')}
              </p>
              <button
                type="button"
                onClick={() => store.pickAndOpen()}
                className={className(
                  'mt-3 rounded-sm px-3 py-1.5 text-[12px] font-medium',
                  tw.accent.on,
                  tw.accent.bg,
                  tw.accent.bgHover,
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  tw.accent.outline,
                )}
              >
                {t('openFile')}
              </button>
            </div>
          ) : (
            <AppScrollArea
              className={tw.background.surface}
              viewportClassName="!h-full"
            >
              <ul className="py-1">
                {recentFiles.map((file: RecentFileRecord) => (
                  <li key={file.path}>
                    <div
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
                        'group flex cursor-pointer items-center gap-3 px-3 py-1.5 transition-colors',
                        tw.hover.recentRow,
                      )}
                    >
                      <DocumentIcon type={file.type} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p
                          className={className(
                            'truncate text-[13px] leading-snug',
                            tw.text.primary,
                          )}
                        >
                          {file.name}
                        </p>
                        <p
                          className={className(
                            'truncate text-[11px] leading-snug',
                            tw.text.quaternary,
                          )}
                        >
                          {file.path}
                        </p>
                      </div>
                      <span
                        className={className(
                          'shrink-0 text-[11px] tabular-nums',
                          tw.text.quaternary,
                        )}
                      >
                        {formatRecentTime(t, file.updatedAt)}
                      </span>
                      <button
                        type="button"
                        title={t('removeRecent')}
                        onClick={(e) => {
                          e.stopPropagation()
                          store.removeRecent(file.path)
                        }}
                        className={className(
                          'shrink-0 rounded-sm p-0.5 opacity-0 transition-opacity',
                          'group-hover:opacity-100 focus-visible:opacity-100',
                          tw.hover.iconBtn,
                        )}
                      >
                        <X size={14} className={tw.text.quaternary} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </AppScrollArea>
          )}
        </main>
      </div>
    </div>
  )
})

export default HomeView
