import { DAYS_FR, ALL_HOURS } from '../../utils/dataUtils';
import { useSettings } from '../../hooks/useSettings';

function getIntensity(value, max) {
  if (max === 0) return 0;
  return Math.min(1, value / max);
}

function heatBg(intensity) {
  if (intensity === 0) return '#212433';
  if (intensity < 0.15) return 'rgba(30,58,138,0.5)';
  if (intensity < 0.30) return 'rgba(29,78,216,0.65)';
  if (intensity < 0.50) return 'rgba(37,99,235,0.75)';
  if (intensity < 0.70) return '#4F8EF7';
  if (intensity < 0.85) return '#60a5fa';
  return '#22d3ee';
}

const LEGEND_COLORS = [
  '#212433',
  'rgba(30,58,138,0.5)',
  'rgba(29,78,216,0.65)',
  'rgba(37,99,235,0.75)',
  '#4F8EF7',
  '#60a5fa',
  '#22d3ee',
];

// Largeur fixe de la colonne label — assez large pour "fermé" + jour empilés
const LABEL_W = 52;
// Hauteur fixe des cellules — largeur fluide (flex:1)
const CELL_H = 38;

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

      <div className="overflow-x-auto">
        {/*
          minWidth bas (360px) pour que les cellules puissent être petites sur mobile,
          mais sur desktop elles s'étirent via flex:1 pour remplir toute la largeur.
        */}
        <div style={{ minWidth: 360 }}>

          {/* Ligne d'en-tête des heures */}
          <div className="flex items-center mb-1.5" style={{ paddingLeft: LABEL_W }}>
            {ALL_HOURS.map((h) => (
              <div
                key={h}
                style={{
                  flex: 1,
                  minWidth: 24,
                  textAlign: 'center',
                  fontSize: 10,
                  color: '#64748b',
                  marginRight: h === 15 ? 8 : 2,
                  flexShrink: 0,
                }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Lignes jours */}
          {DAYS_FR.map((dayName, dow) => {
            const isOpen = settings.openDays[dow] !== false;
            return (
              <div key={dow} className="flex items-center" style={{ marginBottom: 3 }}>

                {/* Colonne label : jour + badge FERMÉ empilés verticalement */}
                <div
                  style={{ width: LABEL_W, flexShrink: 0, paddingRight: 8, textAlign: 'right' }}
                  className="flex flex-col items-end justify-center"
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: isOpen ? '#94a3b8' : '#4b5563',
                      lineHeight: 1.2,
                    }}
                  >
                    {dayName.slice(0, 3)}.
                  </span>
                  {!isOpen && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#ef4444',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                      }}
                    >
                      fermé
                    </span>
                  )}
                </div>

                {/* Cellules heures */}
                {ALL_HOURS.map((h) => {
                  const val = heatmapData[`${dow}-${h}`] || 0;
                  const intensity = getIntensity(val, maxVal);
                  const bg = isOpen ? heatBg(intensity) : '#1a1d27';

                  return (
                    <div
                      key={h}
                      title={isOpen ? `${dayName} ${h}h — ${val} ventes` : `${dayName} — fermé`}
                      style={{
                        flex: 1,
                        minWidth: 24,
                        height: CELL_H,
                        backgroundColor: bg,
                        borderRadius: 5,
                        flexShrink: 0,
                        marginRight: h === 15 ? 8 : 2,
                        cursor: 'default',
                        opacity: isOpen ? 1 : 0.25,
                        transition: 'filter 0.1s',
                        backgroundImage: isOpen
                          ? 'none'
                          : 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.04) 4px,rgba(255,255,255,0.04) 8px)',
                      }}
                      onMouseEnter={(e) => { if (isOpen) e.currentTarget.style.filter = 'brightness(1.25)'; }}
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
            <div key={color} style={{ width: 22, height: 12, backgroundColor: color, borderRadius: 2 }} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">Fort</span>
        <span className="text-[10px] text-text-muted ml-3 opacity-60">· Hachuré = fermé</span>
      </div>
    </div>
  );
}
