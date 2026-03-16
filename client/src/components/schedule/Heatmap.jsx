import { DAYS_FR, ALL_HOURS } from '../../utils/dataUtils';
import { useSettings } from '../../hooks/useSettings';

function getIntensity(value, max) {
  if (max === 0) return 0;
  return Math.min(1, value / max);
}

// Retourne une couleur inline (pas de classe Tailwind dynamique pour éviter la purge)
function heatBg(intensity) {
  if (intensity === 0) return '#212433';
  if (intensity < 0.15) return 'rgba(30,58,138,0.5)';
  if (intensity < 0.30) return 'rgba(29,78,216,0.65)';
  if (intensity < 0.50) return 'rgba(37,99,235,0.75)';
  if (intensity < 0.70) return '#4F8EF7';
  if (intensity < 0.85) return '#60a5fa';
  return '#22d3ee'; // cyan fort = pic
}

// Pour la légende uniquement (valeurs statiques connues)
const LEGEND_COLORS = [
  '#212433',
  'rgba(30,58,138,0.5)',
  'rgba(29,78,216,0.65)',
  'rgba(37,99,235,0.75)',
  '#4F8EF7',
  '#60a5fa',
  '#22d3ee',
];

// Taille fixe des cellules en px — évite les bugs aspect-ratio dans les tableaux
const CELL = 32;

export default function Heatmap({ heatmapData }) {
  const { settings } = useSettings();
  const values = Object.values(heatmapData);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Carte de chaleur des ventes</h2>
        <p className="text-xs text-text-muted mt-0.5">Intensité des ventes par jour × heure — 4 semaines cumulées</p>
      </div>

      {/* overflow-x-auto + overflow-y-visible impossible simultanément → on met les tooltips via title natif */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>
          {/* Header heures */}
          <div className="flex items-center mb-1" style={{ paddingLeft: 48 }}>
            {ALL_HOURS.map((h) => (
              <div
                key={h}
                className="text-center text-[10px] text-text-muted flex-shrink-0"
                style={{
                  width: CELL,
                  marginRight: h === 15 ? 8 : 2,
                }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Grille */}
          {DAYS_FR.map((dayName, dow) => {
            const isOpen = settings.openDays[dow] !== false;
            return (
              <div key={dow} className="flex items-center" style={{ marginBottom: 2 }}>
                {/* Label jour */}
                <div
                  className="text-right flex-shrink-0 pr-2 flex items-center justify-end gap-1"
                  style={{ width: 46 }}
                >
                  {!isOpen && (
                    <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600, lineHeight: 1 }}>FERMÉ</span>
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{ color: isOpen ? '#94a3b8' : '#4b5563' }}
                  >
                    {dayName.slice(0, 3)}.
                  </span>
                </div>

                {ALL_HOURS.map((h) => {
                  const val = heatmapData[`${dow}-${h}`] || 0;
                  const intensity = getIntensity(val, maxVal);
                  const bg = isOpen ? heatBg(intensity) : '#1a1d27';
                  const gapAfter = h === 15;

                  return (
                    <div
                      key={h}
                      title={isOpen ? `${dayName} ${h}h — ${val} ventes` : `${dayName} — jour fermé`}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: bg,
                        borderRadius: 4,
                        flexShrink: 0,
                        marginRight: gapAfter ? 8 : 2,
                        cursor: 'default',
                        opacity: isOpen ? 1 : 0.3,
                        transition: 'filter 0.1s',
                        backgroundImage: isOpen ? 'none' : 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 6px)',
                      }}
                      onMouseEnter={(e) => { if (isOpen) e.currentTarget.style.filter = 'brightness(1.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-text-muted">Faible</span>
        <div className="flex gap-0.5">
          {LEGEND_COLORS.map((color) => (
            <div key={color} style={{ width: 20, height: 12, backgroundColor: color, borderRadius: 2 }} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">Fort</span>
      </div>
    </div>
  );
}
