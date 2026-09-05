import type { InterviewQuestion } from '../../api/types'
import { OTHER_KEY, type AnswerDraft } from './answerDraft'

/*
  Interview sihirbazında TEK bir sorunun girdi alanı. Soru tipine göre render:
  - text     → tek satır input
  - textarea → çok satır textarea
  - choice   → radyo grubu + en sonda "Diğer" (seçilince serbest metin açılır)
  - multi    → checkbox grubu + "Diğer"

  Alan durumu (`AnswerDraft`) dışarıda (InterviewWizard) tutulur; bu bileşen
  yalnızca gösterir ve `onChange` ile kısmi güncelleme yollar. Böylece kullanıcı
  sorular arasında ileri/geri gezerken yazdıkları korunur.
*/

const FIELD_CLASS =
  'block w-full rounded-md border border-border bg-canvas px-3 py-2 text-[13px] leading-relaxed text-fg outline-none transition-colors focus:border-accent focus:bg-surface'

interface QuestionFieldProps {
  question: InterviewQuestion
  draft: AnswerDraft
  onChange: (patch: Partial<AnswerDraft>) => void
}

export function QuestionField({ question, draft, onChange }: QuestionFieldProps) {
  if (question.type === 'text') {
    return (
      <input
        type="text"
        autoFocus
        value={draft.text}
        placeholder={question.placeholder ?? undefined}
        onChange={(e) => onChange({ text: e.target.value })}
        className={FIELD_CLASS}
        aria-label={question.text}
      />
    )
  }

  if (question.type === 'textarea') {
    return (
      <textarea
        autoFocus
        rows={4}
        value={draft.text}
        placeholder={question.placeholder ?? undefined}
        onChange={(e) => onChange({ text: e.target.value })}
        className={`${FIELD_CLASS} resize-y`}
        aria-label={question.text}
      />
    )
  }

  if (question.type === 'choice') {
    return (
      <div role="radiogroup" aria-label={question.text} className="flex flex-col gap-1.5">
        {question.choices.map((choice) => (
          <OptionRow
            key={choice}
            kind="radio"
            name={`q-${question.id}`}
            label={choice}
            checked={draft.choice === choice}
            onSelect={() => onChange({ choice })}
          />
        ))}
        <OptionRow
          kind="radio"
          name={`q-${question.id}`}
          label="Diğer…"
          checked={draft.choice === OTHER_KEY}
          onSelect={() => onChange({ choice: OTHER_KEY })}
        />
        {draft.choice === OTHER_KEY && (
          <OtherInput value={draft.other} onChange={(other) => onChange({ other })} />
        )}
      </div>
    )
  }

  // multi
  return (
    <div role="group" aria-label={question.text} className="flex flex-col gap-1.5">
      {question.choices.map((choice) => {
        const checked = draft.multi.includes(choice)
        return (
          <OptionRow
            key={choice}
            kind="checkbox"
            label={choice}
            checked={checked}
            onSelect={() =>
              onChange({
                multi: checked
                  ? draft.multi.filter((c) => c !== choice)
                  : [...draft.multi, choice],
              })
            }
          />
        )
      })}
      <OptionRow
        kind="checkbox"
        label="Diğer…"
        checked={draft.multiOther}
        onSelect={() => onChange({ multiOther: !draft.multiOther })}
      />
      {draft.multiOther && (
        <OtherInput value={draft.other} onChange={(other) => onChange({ other })} />
      )}
    </div>
  )
}

interface OptionRowProps {
  kind: 'radio' | 'checkbox'
  label: string
  checked: boolean
  onSelect: () => void
  name?: string
}

function OptionRow({ kind, label, checked, onSelect, name }: OptionRowProps) {
  return (
    <label
      className={
        'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-[13px] transition-colors ' +
        (checked
          ? 'border-accent bg-accent-soft text-fg'
          : 'border-border text-fg-muted hover:border-fg-subtle/60 hover:text-fg')
      }
    >
      <input
        type={kind}
        name={name}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={
          'flex h-4 w-4 shrink-0 items-center justify-center border ' +
          (kind === 'radio' ? 'rounded-full' : 'rounded-[4px]') +
          ' ' +
          (checked ? 'border-accent' : 'border-fg-subtle')
        }
      >
        {checked &&
          (kind === 'radio' ? (
            <span className="h-2 w-2 rounded-full bg-accent" />
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4 4 10-10" />
            </svg>
          ))}
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  )
}

function OtherInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      autoFocus
      value={value}
      placeholder="Kendi cevabını yaz…"
      onChange={(e) => onChange(e.target.value)}
      className={`${FIELD_CLASS} mt-0.5`}
      aria-label="Diğer cevap"
    />
  )
}
