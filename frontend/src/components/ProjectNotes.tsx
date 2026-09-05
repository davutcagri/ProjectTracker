import { useState } from 'react'
import { updateProjectNote } from '../api/projects'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

/*
  Proje detay sayfasındaki serbest not alanı (ROADMAP M2 madde 7).
  Aynı idle/saving/saved deseni SettingsPage'de kullanılıyor — buradaki mantık
  bilinçli olarak ona birebir yakın tutuldu (aynı UX dili).

  Boş metin kararı: textarea boşken Kaydet'e basılırsa backend'e `notes: null`
  gönderilir (not temizlenir) — bu backend tarafından desteklenen, istenen
  davranış. SettingsPage'deki "boşken buton pasif" kararından farklı: orada
  boş kök yol geçersiz bir durumdu, burada boş not = "notu sil" geçerli bir
  eylem, o yüzden boşken de buton aktif kalabilir (dirty ise).
*/

type SaveState = 'idle' | 'saving' | 'saved'

const GENERIC_ERROR = 'Not kaydedilemedi. Backend :8420 çalışıyor mu?'

interface ProjectNotesProps {
  projectId: string
  initialNotes: string | null
}

export function ProjectNotes({ projectId, initialNotes }: ProjectNotesProps) {
  const [savedValue, setSavedValue] = useState(initialNotes ?? '')
  const [inputValue, setInputValue] = useState(initialNotes ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleChange(value: string) {
    setInputValue(value)
    if (saveState === 'saved') setSaveState('idle')
    if (errorMsg) setErrorMsg(null)
  }

  async function handleSave() {
    setSaveState('saving')
    setErrorMsg(null)
    const trimmed = inputValue.trim()
    try {
      await updateProjectNote(projectId, trimmed === '' ? null : trimmed)
      setSavedValue(trimmed)
      setInputValue(trimmed)
      setSaveState('saved')
    } catch {
      setSaveState('idle')
      setErrorMsg(GENERIC_ERROR)
    }
  }

  const isDirty = inputValue !== savedValue
  const saveDisabled = saveState === 'saving' || !isDirty

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
        Notlar
      </h2>

      <textarea
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Bu proje hakkında kendine not bırak…"
        rows={5}
        spellCheck={false}
        aria-label="Proje notu"
        aria-invalid={errorMsg ? true : undefined}
        className="mt-3 block w-full resize-y rounded-md border border-border bg-canvas px-3 py-2 text-[13px] leading-relaxed text-fg outline-none transition-colors focus:border-accent focus:bg-surface aria-invalid:border-warning"
      />

      {errorMsg && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-[12.5px] text-warning"
        >
          <Icon name="alert" size={14} className="shrink-0" />
          {errorMsg}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <Button onClick={() => void handleSave()} disabled={saveDisabled}>
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
    </div>
  )
}
