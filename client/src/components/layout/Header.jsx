import { MapPin, Calendar } from 'lucide-react';

const MONTHS_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
];

function formatDateFr(date) {
  const d = date.getDate();
  const m = MONTHS_FR[date.getMonth()];
  const y = date.getFullYear();
  const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const day = days[date.getDay()];
  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${d} ${m} ${y}`;
}

export default function Header({ title }) {
  const today = new Date();

  return (
    <header className="h-14 border-b border-bg-border bg-bg-primary/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-20">
      <div className="flex items-center justify-between w-full">
        {/* Page title */}
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>

        {/* Restaurant info */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
            <Calendar size={13} />
            <span>{formatDateFr(today)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin size={12} />
              <span className="font-medium text-text-primary">Brasserie Le Marais</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
