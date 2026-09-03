import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { fetchSettings, updateSettings } from '../api/settings'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

/*
  Ayarlar sayfası (ROADMAP M1, SCOPE §4 / §8 "Ayarlar: kök yol düzenleme").
  Tek alan: "Projeleri tara"nın baktığı kök yol. app_settings tek satır.

  Boş input kararı: Kaydet butonu, input trim'lendiğinde boşsa PASİF kalır.
  Yani backend'in "Kök yol boş olamaz" 400'üne hiç gitmiyoruz; kullanıcı
  boş bir değeri kazara kaydedemez. Diğer geçersizlik ("klasör değil" vb.)
  yolun görünüşünden anlaşılamadığı için backend'in 400 mesajıyla gösterilir.
*/

type LoadState = 'loading' | 'ready' | 'error'
type SaveState = 'idle' | 'saving' | 'saved'

const GENERIC_400 = 'Kök yol kaydedilemedi. Girdiğiniz yolu kontrol edin.'
const GENERIC_ERROR = 'Kaydedilemedi. Backend :8420 çalışıyor mu?'

export function SettingsPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  // savedPath: sunucuda kayıtlı olan değer. inputValue: kutudaki düzenlenebilir metin.
  const [savedPath, setSavedPath] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function load() {
    setLoadState('loading')
    try {
      const settings = await fetchSettings()
      setSavedPath(settings.rootPath)
      setInputValue(settings.rootPath)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function handleChange(value: string) {
    setInputValue(value)
    // Yeni düzenleme başlayınca eski "kaydedildi" / hata mesajını temizle.
    if (saveState === 'saved') setSaveState('idle')
    if (errorMsg) setErrorMsg(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (inputValue.trim() === '') return

    setSaveState('saving')
    setErrorMsg(null)
    try {
      const settings = await updateSettings(inputValue)
      // Backend değeri trim'ler; kaydedilmiş hâlini esas al.
      setSavedPath(settings.rootPath)
      setInputValue(settings.rootPath)
      setSaveState('saved')
    } catch (err) {
      setSaveState('idle')
      if (isAxiosError(err) && err.response?.status === 400) {
        const apiError = (err.response.data as { error?: string } | undefined)?.error
        setErrorMsg(apiError && apiError.trim() !== '' ? apiError : GENERIC_400)
      } else {
        setErrorMsg(GENERIC_ERROR)
      }
    }
  }

  const isDirty = inputValue !== savedPath
  const saveDisabled =
    saveState === 'saving' || inputValue.trim() === '' || !isDirty

  return (
    <section className="max-w-xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
        Ayarlar
      </h1>

      {loadState === 'loading' && (
        <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3.5 text-[13px] text-fg-muted shadow-card">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sunken border-t-accent" />
          Kayıtlı kök yol yükleniyor…
        </div>
      )}

      {loadState === 'error' && (
        <EmptyState
          icon="alert"
          tone="warning"
          title="Kök yol okunamadı"
          body="Ayar sunucudan alınamadı. Backend :8420 çalışıyor mu kontrol edip yeniden dene."
          action={
            <Button variant="secondary" onClick={() => void load()}>
              Tekrar dene
            </Button>
          }
        />
      )}

      {loadState === 'ready' && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-card"
        >
          <label htmlFor="root-path" className="text-[13px] font-medium text-fg">
            Kök klasör yolu
          </label>
          <input
            id="root-path"
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-invalid={errorMsg ? true : undefined}
            aria-describedby={errorMsg ? 'root-path-msg' : 'root-path-hint'}
            className="mt-2.5 block w-full rounded-md border border-border bg-canvas px-3 py-2 font-mono text-[13px] text-fg outline-none transition-colors focus:border-accent focus:bg-surface aria-invalid:border-warning"
          />

          {errorMsg ? (
            <p
              id="root-path-msg"
              aria-live="polite"
              className="mt-2 flex items-center gap-1.5 text-[12.5px] text-warning"
            >
              <Icon name="alert" size={14} className="shrink-0" />
              {errorMsg}
            </p>
          ) : (
            <p id="root-path-hint" className="mt-2 text-[12.5px] text-fg-muted">
              Mutlak bir klasör yolu girin. Varsayılan: ~/Documents/Projects
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saveDisabled}>
              {saveState === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            {saveState === 'saved' && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-success"
              >
                <Icon name="check" size={14} />
                Kaydedildi
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
