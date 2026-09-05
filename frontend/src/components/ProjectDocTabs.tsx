import { useState } from 'react'
import type { ProjectDoc, ProjectDocFileName } from '../api/types'
import { MarkdownView } from './MarkdownView'
import { EmptyState } from './ui/EmptyState'

/*
  README / SCOPE / ROADMAP sekmeleri (SCOPE §8 "Proje detay sayfası").
  `docs` dizisi backend'den fileName'e göre gelir; sırayı burada sabitliyoruz
  ki dosya sırası backend'de değişse bile sekmeler hep aynı yerde dursun.
*/

const TAB_ORDER: ProjectDocFileName[] = ['README.md', 'SCOPE.md', 'ROADMAP.md']

export function ProjectDocTabs({ docs }: { docs: ProjectDoc[] }) {
  const [activeTab, setActiveTab] = useState<ProjectDocFileName>('README.md')

  const byName = new Map(docs.map((doc) => [doc.fileName, doc]))
  const activeDoc = byName.get(activeTab)

  return (
    <div className="rounded-lg border border-border bg-surface shadow-card">
      <div role="tablist" className="flex gap-1 border-b border-border p-1.5">
        {TAB_ORDER.map((fileName) => {
          const doc = byName.get(fileName)
          const isActive = fileName === activeTab
          return (
            <button
              key={fileName}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(fileName)}
              className={
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ' +
                (isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-fg-muted hover:bg-sunken hover:text-fg')
              }
            >
              {fileName}
              {!doc?.content && (
                <span className="ml-1.5 text-fg-subtle" aria-hidden>
                  ·
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="p-5">
        {activeDoc?.content ? (
          <MarkdownView content={activeDoc.content} />
        ) : (
          <EmptyState
            icon="inbox"
            title={`${activeTab} yok`}
            body={`Proje kökünde ${activeTab} dosyası bulunamadı. Dosyayı ekleyip "Sync"e basınca burada görünür.`}
          />
        )}
      </div>
    </div>
  )
}
