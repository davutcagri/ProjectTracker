import { api } from './client'
import type { InterviewAnswer, InterviewStatusResponse } from './types'

/*
  Interview (doküman görüşmesi) endpoint'leri — SCOPE §6, ROADMAP M4.
  Tüm yollar /api/projects/{id}/interview altında. Akış:
  1. startInterview → backend `claude`'u başlatır (202, status RUNNING).
  2. getInterviewStatus ile ~2 sn'de bir durum sorulur (polling).
  3. WAITING_INPUT gelince sorular sihirbazda gösterilir; cevaplar
     submitAnswers ile çıplak dizi olarak gönderilir (yine 202, RUNNING).
  4. status DONE olunca dokümanlar üretilmiştir; ERROR olunca claude çağrısı
     başarısız olmuştur (bkz. SCOPE §9).
*/

/** POST .../interview/start — gövde yok. 202 + ilk durum (RUNNING). */
export async function startInterview(id: string): Promise<InterviewStatusResponse> {
  const { data } = await api.post<InterviewStatusResponse>(`/projects/${id}/interview/start`)
  return data
}

/**
 * POST .../interview/answers — gövde ÇIPLAK dizi. Yanıttaki pendingQuestions
 * eski sorular olabilir, ona güvenme; polling'e devam et.
 */
export async function submitAnswers(
  id: string,
  answers: InterviewAnswer[],
): Promise<InterviewStatusResponse> {
  const { data } = await api.post<InterviewStatusResponse>(
    `/projects/${id}/interview/answers`,
    answers,
  )
  return data
}

/** GET .../interview — hafif polling. Oturum yoksa 404 fırlatır. */
export async function getInterviewStatus(id: string): Promise<InterviewStatusResponse> {
  const { data } = await api.get<InterviewStatusResponse>(`/projects/${id}/interview`)
  return data
}
