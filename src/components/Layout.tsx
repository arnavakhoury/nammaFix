import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Trophy,
  Gauge,
  Users,
  ExternalLink,
} from 'lucide-react';

type NavItem =
  | { to: string; href?: never; label: string; icon: React.ComponentType<{ className?: string }> }
  | { to?: never; href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const sidebarSections: { label: string; links: NavItem[] }[] = [
  {
    label: 'CIVIC PLATFORM',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/file', label: 'Report Issue', icon: FilePlus },
      { to: '/scoreboard', label: 'Scoreboard', icon: Trophy },
    ],
  },
  {
    label: 'TRAFFIC INTELLIGENCE',
    links: [
      { to: '/traffic', label: 'Traffic Control', icon: Gauge },
      { to: '/crowd-intel', label: 'Crowd Intel', icon: Users },
    ],
  },
  {
    label: 'ADMIN',
    links: [
      {
        href: 'http://localhost:8000/docs',
        label: 'API Docs',
        icon: ExternalLink,
      },
    ],
  },
];

const bottomTabs = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/file', label: 'Report', icon: FilePlus },
  { to: '/traffic', label: 'Traffic', icon: Gauge },
  { to: '/crowd-intel', label: 'Crowd', icon: Users },
  { to: '/scoreboard', label: 'Score', icon: Trophy },
];

const activeCls =
  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ' +
  'bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 pl-[10px]';

const inactiveCls =
  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ' +
  'text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border-l-2 border-transparent pl-[10px]';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[220px] bg-[#1e293b] border-r border-[#334155] z-40">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-white font-bold text-base leading-tight">NammaFix</p>
              <p className="text-slate-500 text-[10px] leading-tight mt-0.5">
                Bengaluru Civic Platform
              </p>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-slate-600 tracking-widest uppercase px-3 mb-1.5">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.links.map((link) =>
                  link.href ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={inactiveCls}
                      >
                        <link.icon className="w-4 h-4 shrink-0" />
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.to}>
                      <NavLink
                        to={link.to!}
                        className={({ isActive }) => (isActive ? activeCls : inactiveCls)}
                      >
                        <link.icon className="w-4 h-4 shrink-0" />
                        {link.label}
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-4 py-3 border-t border-[#334155] space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">API: online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">2 Servers running</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-[220px] mb-16 md:mb-0 min-h-screen bg-[#0f172a]">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-700 flex">
        {bottomTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
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
