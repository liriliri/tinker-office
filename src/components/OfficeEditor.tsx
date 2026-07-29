import { observer } from 'mobx-react-lite'
import { OnlyOfficeEditor } from 'wasm-onlyoffice-sdk/react'
import store from '../store'

const ASSETS_PATH = '/v9.3.0.24-1'
const X2T_PATH = '/x2t'

const OfficeEditor = observer(function OfficeEditor() {
  const { file, docType, editorKey, language, theme } = store

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <OnlyOfficeEditor
        key={editorKey}
        assetsPath={ASSETS_PATH}
        x2tPath={X2T_PATH}
        {...(file ? { file } : { newDocument: docType })}
        language={language}
        theme={theme}
        user={{ id: 'tinker-user', name: 'User' }}
        onReady={() => store.setReady(true)}
        onDocumentStateChange={(dirty) => store.setDirty(dirty)}
        onSave={(blob, filename) => {
          void store.saveBlob(blob, filename)
        }}
        onError={(error) => store.setError(error.message)}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default OfficeEditor
