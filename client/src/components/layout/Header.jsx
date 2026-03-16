import { MapPin, Calendar, Menu } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

const MONTHS_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
];

function formatDateFr(date) {
  const d = date.getDate();
  const m = MONTHS_FR[date.getMonth()];
  const y = date.getFullYear();
  const days = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  return `${days[date.getDay()]} ${d} ${m} ${y}`;
}

export default function Header({ title, onMenuOpen }) {
  const today = new Date();
  const { settings } = useSettings();

  return (
    <header className="h-14 border-b border-bg-border bg-bg-primary/80 backdrop-blur-sm flex items-center px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center justify-between w-full gap-3">

        {/* Hamburger (mobile only) + titre page */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuOpen}
            className="md:hidden flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
        </div>

        {/* Restaurant info */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-text-secondary text-xs">
            <Calendar size={13} />
            <span className="whitespace-nowrap">{formatDateFr(today)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin size={12} className="flex-shrink-0" />
              {/* Nom lu depuis les paramètres — se met à jour en temps réel */}
              <span className="font-medium text-text-primary whitespace-nowrap text-[11px] sm:text-xs">
                {settings.restaurantName}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
