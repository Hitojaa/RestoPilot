import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ title, value, subtitle, trend, icon: Icon, iconColor = 'bg-accent-blue/10', smallValue }) {
  const hasTrend = trend !== undefined && trend !== null;
  const isUp = hasTrend && trend > 0;
  const isDown = hasTrend && trend < 0;

  // smallValue : force une taille de texte réduite pour les valeurs longues (ex: nom de plat)
  const valueSize = smallValue ? 'text-base sm:text-lg font-semibold leading-tight' : 'text-xl sm:text-2xl font-bold';

  return (
    <div className="card card-hover p-4 sm:p-5 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon size={16} className="text-accent-blue" />}
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
            ${isUp ? 'text-accent-green bg-accent-green/10' : isDown ? 'text-accent-red bg-accent-red/10' : 'text-text-muted bg-bg-hover'}`}>
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className={`${valueSize} text-text-primary tracking-tight truncate`}>{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{title}</p>
      </div>

      {subtitle && (
        <p className="text-xs text-text-secondary border-t border-bg-border pt-2 truncate">{subtitle}</p>
      )}
    </div>
  );
}
