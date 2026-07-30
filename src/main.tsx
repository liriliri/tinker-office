import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import OfficeToolbar from './components/OfficeToolbar'
import OfficeEditor from './components/OfficeEditor'
import OfficeErrorBanner from './components/OfficeErrorBanner'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

const OfficeApp = observer(() => {
  return (
    <div className={className('flex h-screen flex-col', tw.background.primary)}>
      <OfficeToolbar />
      <OfficeErrorBanner />
      <OfficeEditor />
    </div>
  )
})

;(async function () {
  const applyTheme = (theme: string) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    store.setThemeFromApp(theme)
  }

  const [language, theme] = await Promise.all([
    tinker.getLanguage(),
    tinker.getTheme(),
  ])

  i18n.changeLanguage(language)
  store.setLanguage(language)
  applyTheme(theme)
  tinker.on('changeTheme', applyTheme)
  tinker.on('changeLanguage', (lang: string) => {
    i18n.changeLanguage(lang)
    store.setLanguage(lang)
  })

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<OfficeApp />)
})()
