import { NavLink } from 'react-router-dom'

/*
  Sol kenar çubuğu — defterin sırtı gibi. Uygulama adı + ana bölümler.
*/

const items = [
  { to: '/', label: 'Projeler', end: true },
  { to: '/logs', label: 'Loglar', end: false },
  { to: '/settings', label: 'Ayarlar', end: false },
]

export function SideNav() {
  return (
    <nav className="flex h-full w-full flex-col gap-8 px-5 py-6">
      <div>
        <div className="font-mono text-[15px] font-semibold tracking-tight">
          project<span className="text-done">/</span>tracker
        </div>
        <div className="eyebrow mt-1">yerel yol haritası paneli</div>
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'block rounded-sm px-2.5 py-1.5 font-mono text-[13px] transition-colors ' +
                (isActive
                  ? 'bg-panel text-ink shadow-[inset_2px_0_0_var(--color-done)]'
                  : 'text-ink-soft hover:text-ink')
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
