import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiErrorMessage, apiErrorStatus } from '../api/client'
import { getInterviewStatus, startInterview, submitAnswers } from '../api/interview'
import type {
  InterviewAnswer,
  InterviewErrorKind,
  InterviewQuestion,
  InterviewStatusResponse,
} from '../api/types'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { Modal } from './ui/Modal'
import {
  draftToAnswerText,
  emptyDraft,
  isDraftAnswered,
  type AnswerDraft,
} from './interview/answerDraft'
import { QuestionField } from './interview/QuestionField'

/*
  Interview sihirbazı (ROADMAP M4 madde 12, SCOPE §6 / §8).

  Bu bileşen AÇILDIĞINDA görüşme zaten başlatılmış olmalıdır — çağıran taraf
  önce `POST .../interview/start` çağırır (kart/detay "Sync" akışı, madde 13),
  409 gibi hataları orada gösterir, sonra sihirbazı açar.

  Akış:
  - Bileşen ~2 sn'de bir `GET .../interview` ile durum sorar (polling).
    "state" = React'te zamanla değişen ve arayüzü tetikleyen değer;
    "polling" = sunucuya belirli aralıklarla tekrar tekrar sorma.
  - RUNNING           → "Claude düşünüyor" ekranı (spinner).
  - WAITING_INPUT     → yeni sorularla sihirbazı doldur; kullanıcı tek tek cevaplar.
  - Tüm sorular bitince "Gönder" → `POST .../interview/answers` (çıplak dizi),
    tekrar polling'e dönülür (yeni tur veya DONE).
  - DONE             → başarı ekranı; kapatınca çağıran veriyi tazeler.
  - ERROR            → hata ekranı + "Tekrar dene" (yeni start).
  - Polling, bileşen kapanınca (unmount) veya DONE/ERROR'da durdurulur.
*/

const POLL_MS = 2000

type Phase = 'thinking' | 'answering' | 'done' | 'error'

interface InterviewWizardProps {
  projectId: string
  projectName: string
  /**
   * İptal / kapat — görüşme arka planda kalır, panel kapanır.
   * Görüşme ERROR ile bitmişken kapatılırsa `outcome` dolu gelir; çağıran
   * bunu ilgili proje kartında hata satırı göstermek için kullanır (SCOPE §9).
   */
  onClose: (outcome?: { errorKind: InterviewErrorKind }) => void
  /** Dokümanlar üretildi (DONE) — çağıran listeyi/detayı yeniden çekmeli. */
  onCompleted: () => void
}

/** ERROR ekranında `errorKind`'e göre başlık + gövde metni (SCOPE §9, M6 madde 3). */
function errorContent(kind: InterviewErrorKind): {
  title: string
  body: React.ReactNode
} {
  const code =
    'rounded bg-sunken px-1 py-0.5 font-mono text-[12px] text-fg'
  if (kind === 'NOT_AUTHENTICATED') {
    return {
      title: "Claude'a giriş yapılmamış",
      body: (
        <>
          ProjectTracker doküman üretmek için yerel <code className={code}>claude</code>{' '}
          komutunu kullanıyor ama oturum açık değil. Bir terminalde{' '}
          <code className={code}>claude</code> çalıştırıp giriş yaptıktan sonra
          &nbsp;“Tekrar dene”ye bas.
        </>
      ),
    }
  }
  if (kind === 'TIMEOUT') {
    return {
      title: 'Claude 5 dakikada yanıt vermedi',
      body: 'İşlem zaman aşımına uğradı. “Tekrar dene” ile yeniden başlatabilirsin.',
    }
  }
  return {
    title: 'claude çağrısı başarısız oldu',
    body: 'Görüşme tamamlanamadı. Ayrıntılar Loglar sayfasında.',
  }
}

export function InterviewWizard({
  projectId,
  projectName,
  onClose,
  onCompleted,
}: InterviewWizardProps) {
  const [phase, setPhase] = useState<Phase>('thinking')
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>({})
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fatalMessage, setFatalMessage] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<InterviewErrorKind>(null)
  const [retrying, setRetrying] = useState(false)

  // Halihazırda sihirbaza yüklenmiş soru turunun "imzası" (id listesi). Aynı tur
  // tekrar tekrar gelince (polling) drafts'ı sıfırlamamak için kullanılır.
  const loadedSigRef = useRef<string | null>(null)

  useEffect(() => {
    if (phase === 'done' || phase === 'error') return
    let cancelled = false

    function applyStatus(res: InterviewStatusResponse) {
      if (res.status === 'DONE') {
        setPhase('done')
        return
      }
      if (res.status === 'ERROR') {
        setFatalMessage(null)
        setErrorKind(res.errorKind)
        setPhase('error')
        return
      }
      if (res.status === 'WAITING_INPUT' && res.pendingQuestions.length > 0) {
        const sig = res.pendingQuestions.map((q) => q.id).join('|')
        if (sig !== loadedSigRef.current) {
          loadedSigRef.current = sig
          setQuestions(res.pendingQuestions)
          setDrafts({})
          setSkipped({})
          setStepIndex(0)
          setSubmitError(null)
          setPhase('answering')
        }
        return
      }
      // RUNNING (veya sorusuz WAITING_INPUT): cevap formunu bozmadan bekle.
      if (phase !== 'answering') setPhase('thinking')
    }

    async function poll() {
      try {
        const res = await getInterviewStatus(projectId)
        if (!cancelled) applyStatus(res)
      } catch (err) {
        if (!cancelled && apiErrorStatus(err) === 404) {
          setFatalMessage('Bu görüşme sona ermiş. Yeniden başlatabilir ya da paneli kapatabilirsin.')
          setErrorKind(null)
          setPhase('error')
        }
        // Geçici ağ hatası: bir sonraki tur yeniden dener.
      }
    }

    void poll()
    const iv = window.setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(iv)
    }
  }, [phase, projectId])

  function close() {
    if (phase === 'done') {
      onCompleted()
      onClose()
      return
    }
    if (phase === 'error') {
      onClose({ errorKind: fatalMessage ? null : errorKind })
      return
    }
    onClose()
  }

  const current = questions[stepIndex] as InterviewQuestion | undefined
  const currentDraft = current ? (drafts[current.id] ?? emptyDraft()) : emptyDraft()
  const isLastStep = stepIndex === questions.length - 1
  const currentAnswered = current ? isDraftAnswered(current, currentDraft) : false
  const currentSkipped = current ? Boolean(skipped[current.id]) : false

  function patchDraft(patch: Partial<AnswerDraft>) {
    if (!current) return
    const id = current.id
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyDraft()), ...patch } }))
    setSkipped((prev) => (prev[id] ? { ...prev, [id]: false } : prev))
  }

  async function submitAll() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const answers: InterviewAnswer[] = questions.map((q) => {
        if (skipped[q.id]) return { questionId: q.id, answer: '', skipped: true }
        const d = drafts[q.id] ?? emptyDraft()
        return { questionId: q.id, answer: draftToAnswerText(q, d), skipped: false }
      })
      await submitAnswers(projectId, answers)
      setPhase('thinking')
    } catch (err) {
      setSubmitError(apiErrorMessage(err) ?? 'Cevaplar gönderilemedi. Tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  function goForward() {
    if (isLastStep) void submitAll()
    else setStepIndex((i) => i + 1)
  }

  function handleSkip() {
    if (!current) return
    setSkipped((prev) => ({ ...prev, [current.id]: true }))
    goForward()
  }

  async function handleRetry() {
    setRetrying(true)
    setFatalMessage(null)
    setErrorKind(null)
    try {
      await startInterview(projectId)
      loadedSigRef.current = null
      setQuestions([])
      setPhase('thinking')
    } catch (err) {
      setFatalMessage(apiErrorMessage(err) ?? 'Görüşme yeniden başlatılamadı.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Modal onClose={close} labelledBy="interview-wizard-title">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            <Icon name="sparkle" size={13} className="text-accent" />
            Doküman görüşmesi
          </p>
          <p
            id="interview-wizard-title"
            className="mt-0.5 truncate text-[14px] font-semibold text-fg"
            title={projectName}
          >
            {projectName}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          title="İptal"
          aria-label="Görüşmeyi iptal et"
          className="-mr-1.5 -mt-1 rounded-md p-1.5 text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="px-5 py-5">
        {phase === 'thinking' && <ThinkingView />}

        {phase === 'answering' && current && (
          <div>
            <StepTicks count={questions.length} current={stepIndex} />
            <p className="mt-2 text-[12px] tabular-nums text-fg-subtle">
              Soru {stepIndex + 1} / {questions.length}
            </p>

            <p className="mt-3 flex gap-2 text-[15px] font-medium leading-snug text-fg">
              <span className="mt-px shrink-0 font-mono text-accent">›</span>
              <span>{current.text}</span>
            </p>

            <div className="mt-3">
              <QuestionField
                key={current.id}
                question={current}
                draft={currentDraft}
                onChange={patchDraft}
              />
            </div>

            {currentSkipped && (
              <p className="mt-2 text-[12px] text-fg-subtle">
                Bu soru geçildi olarak işaretli. Cevap yazarsan geri alınır.
              </p>
            )}

            {submitError && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-1.5 text-[12.5px] text-warning"
              >
                <Icon name="alert" size={14} className="shrink-0" />
                {submitError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                {stepIndex > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    disabled={submitting}
                  >
                    Geri
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleSkip} disabled={submitting}>
                  Geç
                </Button>
                <Button
                  onClick={goForward}
                  disabled={submitting || (!currentAnswered && !currentSkipped)}
                >
                  {isLastStep ? (submitting ? 'Gönderiliyor…' : 'Gönder') : 'İleri'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <ResultView
            icon="check"
            tone="success"
            title="Dokümanlar oluşturuldu"
            body="Claude, eksik README / SCOPE / ROADMAP dosyalarını proje klasörüne yazdı. Kapatınca liste güncellenir."
            action={<Button onClick={close}>Kapat</Button>}
          />
        )}

        {phase === 'error' && (
          <ResultView
            icon="alert"
            tone="warning"
            title={fatalMessage ? 'Görüşme sürdürülemedi' : errorContent(errorKind).title}
            body={fatalMessage ?? errorContent(errorKind).body}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => void handleRetry()} disabled={retrying}>
                  {retrying ? 'Başlatılıyor…' : 'Tekrar dene'}
                </Button>
                <Button variant="secondary" onClick={close} disabled={retrying}>
                  Kapat
                </Button>
                <Link
                  to="/logs"
                  onClick={() => close()}
                  className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
                >
                  Loglar'a bak
                  <Icon name="arrowRight" size={13} />
                </Link>
              </div>
            }
          />
        )}
      </div>
    </Modal>
  )
}

function StepTicks({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={
            'h-1 flex-1 rounded-[2px] ' +
            (i < current ? 'bg-accent' : i === current ? 'bg-accent/50' : 'bg-sunken')
          }
        />
      ))}
    </div>
  )
}

function ThinkingView() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <p className="flex items-center gap-1.5 font-mono text-[13px] text-fg">
        <span className="text-accent">›</span>
        Claude düşünüyor
        <span className="inline-block h-3.5 w-1.5 animate-pulse bg-accent" />
      </p>
      <p className="mt-2 max-w-xs text-[12.5px] text-fg-muted">
        Sorular hazırlanıyor ve dokümanlar yazılıyor. Bu bir-iki dakika sürebilir —
        panel açık kalmasa da görüşme arka planda devam eder.
      </p>
    </div>
  )
}

interface ResultViewProps {
  icon: 'check' | 'alert'
  tone: 'success' | 'warning'
  title: string
  body: React.ReactNode
  action: React.ReactNode
}

function ResultView({ icon, tone, title, body, action }: ResultViewProps) {
  const toneClass =
    tone === 'success' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClass}`}>
        <Icon name={icon} size={20} />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-fg">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[13px] text-fg-muted">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  )
}
