/**
 * Badge coloré pour le statut d'un plat
 * bestseller  → 🟢 vert
 * moyen       → 🟡 jaune
 * déclin      → 🔴 rouge
 * faux-bon    → ⚠️  violet / ambre
 */
const BADGE_CONFIG = {
  bestseller: { label: 'Bestseller', className: 'badge-green', dot: '🟢' },
  moyen:      { label: 'Moyen',      className: 'badge-yellow', dot: '🟡' },
  déclin:     { label: 'En déclin',  className: 'badge-red',    dot: '🔴' },
  'faux-bon': { label: 'Faux bon plat', className: 'badge-purple', dot: '⚠️' },
};

export default function DishBadge({ status }) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.moyen;
  return (
    <span className={config.className}>
      {config.dot} {config.label}
    </span>
  );
}
