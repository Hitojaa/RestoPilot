import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Carte KPI générique
 * @param {string}  title     - Titre de la métrique
 * @param {string}  value     - Valeur principale (déjà formatée)
 * @param {string}  subtitle  - Sous-texte (optionnel)
 * @param {number}  trend     - Variation en % vs période précédente (optionnel)
 * @param {React.ReactNode} icon  - Icône Lucide
 * @param {string}  iconColor - Couleur bg de l'icône (ex: 'bg-blue-500/15')
 */
export default function KPICard({ title, value, subtitle, trend, icon: Icon, iconColor = 'bg-accent-blue/10' }) {
  const hasTrend = trend !== undefined && trend !== null;
  const isUp = hasTrend && trend > 0;
  const isDown = hasTrend && trend < 0;

  return (
    <div className="card card-hover p-5 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon size={18} className="text-accent-blue" />}
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
            ${isUp ? 'text-accent-green bg-accent-green/10' : isDown ? 'text-accent-red bg-accent-red/10' : 'text-text-muted bg-bg-hover'}`}>
            {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{title}</p>
      </div>

      {subtitle && (
        <p className="text-xs text-text-secondary border-t border-bg-border pt-2">{subtitle}</p>
      )}
    </div>
  );
}
