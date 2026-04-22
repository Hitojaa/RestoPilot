import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  TrendingUp,
  Settings,
  ChefHat,
  LogOut,
  X,
  Upload,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dishes',    icon: UtensilsCrossed, label: 'Mes Plats' },
  { to: '/schedule',  icon: Clock,           label: 'Heures & Jours' },
  { to: '/pricing',   icon: TrendingUp,      label: 'Prix & Revenus' },
  { to: '/waste',     icon: Leaf,            label: 'Gaspillage' },
];

const BOTTOM_ITEMS = [
  { to: '/import',   icon: Upload,   label: 'Importer CSV' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Ferme le drawer si on appuie sur Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Bloque le scroll body quand le drawer est ouvert sur mobile
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  // Avatar couleur depuis les settings
  const avatarColor  = settings.color  || '#4F8EF7';
  const avatarEmoji  = settings.emoji  || '🍽️';

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-56 bg-bg-card border-r border-bg-border flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        {/* Logo + bouton fermeture (mobile only) */}
        <div className="px-5 py-5 border-b border-bg-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center flex-shrink-0">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-none">RestoPilot</p>
              <p className="text-[10px] text-text-muted mt-0.5">Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover"
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
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

        {/* Bas de sidebar */}
        <div className="px-3 pb-3 space-y-0.5 border-t border-bg-border pt-3">
          {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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

          {/* User card + logout */}
          {user && (
            <div className="mt-2 pt-2 border-t border-bg-border">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: avatarColor + '22', border: `1.5px solid ${avatarColor}44` }}
                >
                  {avatarEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{user.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-hover hover:text-accent-red transition-all duration-150"
              >
                <LogOut size={15} className="flex-shrink-0" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
