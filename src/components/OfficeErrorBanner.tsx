import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { AlertCircle } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const OfficeErrorBanner = observer(function OfficeErrorBanner() {
  const { t } = useTranslation()
  const { error } = store
  if (!error) return null

  return (
    <div
      className={className(
        'flex shrink-0 items-start gap-2 border-b px-3 py-2 text-sm',
        tw.error.background,
        tw.error.border
      )}
    >
      <AlertCircle
        size={16}
        className={className('mt-0.5 shrink-0', tw.error.icon.text)}
      />
      <div className="min-w-0 flex-1">
        <div className={className('font-medium', tw.error.text.title)}>
          {t('errorTitle')}
        </div>
        <div className={className('break-words', tw.error.text.content)}>
          {error}
        </div>
      </div>
      <button
        type="button"
        className={className('text-xs underline', tw.error.text.content)}
        onClick={() => store.setError(null)}
      >
        {t('dismiss')}
      </button>
    </div>
  )
})

export default OfficeErrorBanner
