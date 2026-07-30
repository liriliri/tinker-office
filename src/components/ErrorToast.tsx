import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const ErrorToast = observer(function ErrorToast() {
  const { t } = useTranslation()

  return (
    <>
      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        duration={4000}
        className={className(
          tw.toast.root,
          'data-[state=open]:animate-[toast-in_0.2s_ease-out] data-[state=closed]:opacity-0 transition-opacity',
        )}
      >
        <div className="min-w-0 flex-1">
          <Toast.Title className={tw.toast.title}>
            {t('errorTitle')}
          </Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {store.toastMsg}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close} aria-label={t('close')}>
          <X size={14} strokeWidth={2} />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className={tw.toast.viewport} />
    </>
  )
})

export default ErrorToast
