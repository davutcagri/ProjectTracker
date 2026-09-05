import type { InterviewQuestion } from '../../api/types'

/*
  Interview sihirbazında tek bir sorunun cevap taslağı (`AnswerDraft`) ve onu
  yorumlayan saf yardımcılar. Bileşen değil — QuestionField ve InterviewWizard
  ortak kullanır.
*/

/** choice/multi listesinde "Diğer" seçeneğini temsil eden sabit anahtar. */
export const OTHER_KEY = '__other__'

export interface AnswerDraft {
  /** text / textarea değeri */
  text: string
  /** choice: seçili şık ('' = yok, OTHER_KEY = "Diğer") */
  choice: string
  /** multi: seçili hazır şıklar */
  multi: string[]
  /** multi: "Diğer" kutusu işaretli mi */
  multiOther: boolean
  /** choice & multi: "Diğer" serbest metni */
  other: string
}

export function emptyDraft(): AnswerDraft {
  return { text: '', choice: '', multi: [], multiOther: false, other: '' }
}

/** Kullanıcı bu soruya geçerli bir cevap verdi mi (Geç'e basmadan ilerleyebilir mi)? */
export function isDraftAnswered(question: InterviewQuestion, d: AnswerDraft): boolean {
  switch (question.type) {
    case 'text':
    case 'textarea':
      return d.text.trim() !== ''
    case 'choice':
      if (d.choice === OTHER_KEY) return d.other.trim() !== ''
      return d.choice !== ''
    case 'multi':
      if (d.multiOther && d.other.trim() !== '') return true
      return d.multi.length > 0
    default:
      return d.text.trim() !== ''
  }
}

/** Draft'ı backend'in beklediği düz metne çevirir (multi → virgülle birleşik). */
export function draftToAnswerText(question: InterviewQuestion, d: AnswerDraft): string {
  switch (question.type) {
    case 'choice':
      return d.choice === OTHER_KEY ? d.other.trim() : d.choice
    case 'multi': {
      const parts = [...d.multi]
      if (d.multiOther && d.other.trim() !== '') parts.push(d.other.trim())
      return parts.join(', ')
    }
    default:
      return d.text.trim()
  }
}
