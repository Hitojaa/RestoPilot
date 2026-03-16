/**
 * Badge coloré pour le statut d'un plat
 *
 * bestseller → ⭐ vert foncé   — pilier du CA
 * en-hausse  → 📈 vert clair   — tendance positive cette semaine
 * stable     → ➡️  gris neutre  — ventes régulières (remplace "moyen" péjoratif)
 * déclin     → 📉 rouge        — baisse consécutive significative
 * faux-bon   → ⚠️  violet      — bonne réputation mais peu vendu
 */
const BADGE_CONFIG = {
  bestseller:  { label: 'Bestseller',  className: 'badge-green',  symbol: '⭐' },
  'en-hausse': { label: 'En hausse',   className: 'badge-teal',   symbol: '↑' },
  stable:      { label: 'Stable',      className: 'badge-neutral', symbol: '→' },
  déclin:      { label: 'En déclin',   className: 'badge-red',    symbol: '↓' },
  'faux-bon':  { label: 'Faux bon plat', className: 'badge-purple', symbol: '⚠' },
};

export default function DishBadge({ status }) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.stable;
  return (
    <span className={config.className}>
      {config.symbol} {config.label}
    </span>
  );
}
