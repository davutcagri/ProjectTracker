import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'

/*
  Uygulama kabuğu: solda sabit index çubuğu, üstte "çalışma dizini" okuması
  (hangi kök yol taranıyor), altında sayfa içeriği (<Outlet />).
  Kök yol şimdilik sabit; Ayarlar sayfası bağlanınca oradan gelecek.
*/

const ROOT_PATH_PLACEHOLDER = '~/Documents/Projects'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <aside className="hidden w-[232px] shrink-0 border-r border-rule sm:block">
        <div className="sticky top-0">
          <SideNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-rule px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-[12px] text-ink-soft">
            <span className="text-planned">kök</span>
            <span className="text-ink">{ROOT_PATH_PLACEHOLDER}</span>
          </div>
          <span className="eyebrow">localhost:8420</span>
        </header>

        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
