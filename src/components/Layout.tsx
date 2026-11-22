import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Flame, LayoutDashboard, FilePlus, Trophy,
  Gauge, Users, ExternalLink, Menu, X,
  MapPin, Bell,
} from 'lucide-react';

type NavItem =
  | { kind: 'link'; to: string; label: string; icon: React.ComponentType<{ className?: string }> }
  | { kind: 'ext'; href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const sections: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Civic Platform',
    items: [
      { kind: 'link', to: '/dashboard',  label: 'City Dashboard',  icon: LayoutDashboard },
      { kind: 'link', to: '/file',       label: 'Report Issue',    icon: FilePlus },
      { kind: 'link', to: '/scoreboard', label: 'Scoreboard',      icon: Trophy },
    ],
  },
  {
    heading: 'Traffic Intelligence',
    items: [
      { kind: 'link', to: '/traffic',    label: 'Traffic Control', icon: Gauge },
      { kind: 'link', to: '/crowd-intel',label: 'Crowd Intel',     icon: Users },
    ],
  },
  {
    heading: 'Integrations',
    items: [
      { kind: 'ext', href: 'http://localhost:8000/docs', label: 'API Docs ↗', icon: ExternalLink },
    ],
  },
];

const bottomTabs = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/file',       label: 'Report',    icon: FilePlus },
  { to: '/traffic',    label: 'Traffic',   icon: Gauge },
  { to: '/crowd-intel',label: 'Crowd',     icon: Users },
  { to: '/scoreboard', label: 'Scores',    icon: Trophy },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#060910] text-slate-200 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#0d1117] border-r border-white/[0.06]">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">NammaFix</p>
            <p className="text-slate-600 text-[10px] leading-tight">Bengaluru Civic Platform</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map(sec => (
            <div key={sec.heading}>
              <p className="text-[10px] font-semibold text-slate-700 tracking-[0.1em] uppercase px-2 mb-1.5">
                {sec.heading}
              </p>
              <ul className="space-y-0.5">
                {sec.items.map(item =>
                  item.kind === 'ext' ? (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          isActive
                            ? 'flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-semibold text-orange-400 bg-orange-500/10 ring-1 ring-orange-500/20'
                            : 'flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors'
                        }
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            API online · localhost:8000
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <MapPin className="w-3 h-3" />
            Bengaluru · 198 wards tracked
          </div>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[#0d1117] border-b border-white/[0.06] flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-white font-bold text-sm">NammaFix</span>
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.06] transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#0d1117] border-r border-white/[0.08] p-4 pt-16"
            onClick={e => e.stopPropagation()}
          >
            {sections.map(sec => (
              <div key={sec.heading} className="mb-5">
                <p className="text-[10px] font-semibold text-slate-700 tracking-[0.1em] uppercase px-2 mb-1.5">{sec.heading}</p>
                {sec.items.map(item =>
                  item.kind === 'ext' ? (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-2 py-2.5 rounded-md text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />{item.label}
                    </a>
                  ) : (
                    <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => isActive
                        ? 'flex items-center gap-2.5 px-2 py-2.5 rounded-md text-sm font-semibold text-orange-400 bg-orange-500/10'
                        : 'flex items-center gap-2.5 px-2 py-2.5 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors'
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />{item.label}
                    </NavLink>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile bottom tabs ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-[#0d1117] border-t border-white/[0.06] flex">
        {bottomTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
                isActive ? 'text-orange-400' : 'text-slate-600 hover:text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
