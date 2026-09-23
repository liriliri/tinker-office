import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import HomeView from './components/HomeView'
import OfficeEditor from './components/OfficeEditor'
import ErrorToast from './components/ErrorToast'
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
  const { view } = store

  return (
    <Toast.Provider swipeDirection="down" duration={4000}>
      <div
        className={className('flex h-screen flex-col', tw.background.primary)}
      >
        {view === 'home' ? <HomeView /> : <OfficeEditor />}
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

;(async function () {
  const [language, theme] = await Promise.all([
    tinker.getLanguage(),
    tinker.getTheme(),
  ])

  i18n.changeLanguage(language)
  store.setLanguage(language)
  store.setThemeFromApp(theme)
  store.loadRecentFiles()
  await store.initFromLaunch()

  tinker.on('changeTheme', (theme: string) => store.setThemeFromApp(theme))
  tinker.on('changeLanguage', (lang: string) => {
    i18n.changeLanguage(lang)
    store.setLanguage(lang)
  })

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<OfficeApp />)
})()
