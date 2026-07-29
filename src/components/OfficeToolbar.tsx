import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { FileSpreadsheet, FileText, FolderOpen, Presentation } from 'lucide-react'
import type { DocType } from '../types'
import store from '../store'
import { tw } from '../theme'

const DOC_TYPES: { type: DocType; icon: typeof FileText; labelKey: string }[] = [
  { type: 'docx', icon: FileText, labelKey: 'newDocx' },
  { type: 'xlsx', icon: FileSpreadsheet, labelKey: 'newXlsx' },
  { type: 'pptx', icon: Presentation, labelKey: 'newPptx' },
]

const OfficeToolbar = observer(function OfficeToolbar() {
  const { t } = useTranslation()
  const { fileName, isDirty, ready, docType } = store

  return (
    <header
      className={className(
        'flex h-11 shrink-0 items-center gap-2 border-b px-3',
        tw.background.surface,
        tw.border.secondary
      )}
    >
      <div className="flex items-center gap-1">
        {DOC_TYPES.map(({ type, icon: Icon, labelKey }) => {
          const active = !store.file && docType === type
          return (
            <button
              key={type}
              type="button"
              title={t(labelKey)}
              onClick={() => store.newDocument(type)}
              className={className(
                'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? className(
                      tw.button.active.base,
                      tw.button.active.border,
                      tw.button.active.text
                    )
                  : className(
                      tw.button.secondary.base,
                      tw.button.secondary.border,
                      tw.button.secondary.hover,
                      tw.text.secondary
                    )
              )}
            >
              <Icon size={14} strokeWidth={2} />
              <span className="uppercase">{type}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => store.pickAndOpen()}
        className={className(
          'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors',
          tw.button.secondary.base,
          tw.button.secondary.border,
          tw.button.secondary.hover,
          tw.text.secondary
        )}
      >
        <FolderOpen size={14} strokeWidth={2} />
        {t('open')}
      </button>

      <div
        className={className(
          'ml-2 min-w-0 flex-1 truncate text-sm',
          tw.text.secondary
        )}
        title={fileName}
      >
        {fileName}
        {isDirty ? (
          <span className={className('ml-2 text-xs', tw.text.quaternary)}>
            {t('unsaved')}
          </span>
        ) : ready ? (
          <span className={className('ml-2 text-xs', tw.text.quaternary)}>
            {t('saved')}
          </span>
        ) : null}
      </div>
    </header>
  )
})

export default OfficeToolbar
