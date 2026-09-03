import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'

/*
  Sol kenar menü — marka + ana bölümler.
  Aktif sekme mor aksan tintiyle vurgulanır; diğerleri sessiz gri.
*/

const items: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'Projeler', icon: 'projects', end: true },
  { to: '/logs', label: 'Loglar', icon: 'logs', end: false },
  { to: '/settings', label: 'Ayarlar', icon: 'settings', end: false },
]

export function SideNav() {
  return (
    <nav className="flex h-full w-full flex-col gap-7 px-4 py-5">
      <div className="flex items-center gap-2.5 px-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
          <Icon name="check" size={15} />
        </span>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-[-0.01em] text-fg">
            Project Tracker
          </div>
          <div className="text-[11px] text-fg-subtle">Yerel proje panosu</div>
        </div>
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ' +
                (isActive
                  ? 'bg-accent-soft font-medium text-accent'
                  : 'text-fg-muted hover:bg-sunken hover:text-fg')
              }
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
