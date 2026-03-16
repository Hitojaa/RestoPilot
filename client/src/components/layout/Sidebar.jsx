import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  TrendingUp,
  ChefHat,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dishes',  icon: UtensilsCrossed, label: 'Mes Plats' },
  { to: '/schedule',icon: Clock,           label: 'Heures & Jours' },
  { to: '/pricing', icon: TrendingUp,      label: 'Prix & Revenus' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-bg-card border-r border-bg-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center flex-shrink-0">
            <ChefHat size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary leading-none">RestoPilot</p>
            <p className="text-[10px] text-text-muted mt-0.5">Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                 : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
               }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-bg-border">
        <p className="text-[10px] text-text-muted text-center">v0.1.0 — MVP</p>
      </div>
    </aside>
  );
}
