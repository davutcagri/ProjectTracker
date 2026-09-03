import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { Icon } from '../ui/Icon'
import { fetchSettings } from '../../api/settings'

/*
  Uygulama kabuğu: solda sabit kenar menü, üstte ince bir şerit (hangi kök
  klasörün taranacağını gösterir), altında sayfa içeriği (<Outlet />).
  Kök yol Ayarlar'dan (app_settings) okunur; okunamazsa sabit değere düşülür.
*/

const ROOT_PATH_FALLBACK = '~/Documents/Projects'

export function AppShell() {
  const [rootPath, setRootPath] = useState(ROOT_PATH_FALLBACK)

  useEffect(() => {
    let active = true
    fetchSettings()
      .then((settings) => {
        if (active && settings.rootPath) setRootPath(settings.rootPath)
      })
      .catch(() => {
        /* backend yoksa / hata varsa sabit değer kalır — şerit kırılmasın */
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface md:block">
        <SideNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-surface/85 px-6 backdrop-blur">
          <span
            className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-sunken px-2 py-1 font-mono text-[12px] text-fg-muted"
            title={rootPath}
          >
            <Icon name="folder" size={13} className="shrink-0 text-fg-subtle" />
            <span className="truncate">{rootPath}</span>
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10 sm:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
