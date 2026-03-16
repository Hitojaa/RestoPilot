import { DAYS_FR, ALL_HOURS, LUNCH_HOURS } from '../../utils/dataUtils';

function getIntensity(value, max) {
  if (max === 0) return 0;
  return Math.min(1, value / max);
}

function heatColor(intensity) {
  // Interpolation bleu foncé → bleu → cyan pour heat map
  if (intensity === 0) return 'bg-bg-hover';
  if (intensity < 0.15) return 'bg-blue-900/40';
  if (intensity < 0.30) return 'bg-blue-800/60';
  if (intensity < 0.50) return 'bg-blue-700/70';
  if (intensity < 0.70) return 'bg-accent-blue/80';
  if (intensity < 0.85) return 'bg-blue-400/90';
  return 'bg-cyan-400';
}

export default function Heatmap({ heatmapData, sales }) {
  // Trouver le max global pour normalisation
  const values = Object.values(heatmapData);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Carte de chaleur des ventes</h2>
        <p className="text-xs text-text-muted mt-0.5">Intensité des ventes par jour × heure — 4 semaines cumulées</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 min-w-[560px]">
          <thead>
            <tr>
              <th className="w-20 text-right pr-2 text-xs text-text-muted font-normal pb-1" />
              {ALL_HOURS.map((h) => (
                <th key={h} className="text-center text-[10px] text-text-muted font-normal pb-1">
                  {h}h
                  {h === LUNCH_HOURS[LUNCH_HOURS.length - 1] + 1
                    ? <span className="block text-[8px] text-bg-border">·</span>
                    : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_FR.map((dayName, dow) => (
              <tr key={dow}>
                <td className="pr-2 text-right text-xs text-text-secondary font-medium py-0.5 w-20">
                  {dayName.slice(0, 3)}.
                </td>
                {ALL_HOURS.map((h, hIdx) => {
                  const val = heatmapData[`${dow}-${h}`] || 0;
                  const intensity = getIntensity(val, maxVal);
                  const colorClass = heatColor(intensity);
                  // Séparateur visuel entre midi et soir
                  const gapAfter = h === 15;

                  return (
                    <td key={h} className={`group relative ${gapAfter ? 'pr-2' : ''}`}>
                      <div
                        title={`${dayName} ${h}h — ${val} ventes`}
                        className={`w-full aspect-square min-w-[26px] rounded-sm ${colorClass}
                          cursor-default transition-all duration-100
                          group-hover:ring-1 group-hover:ring-white/30 group-hover:scale-110`}
                      />
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1
                          opacity-0 group-hover:opacity-100 transition-opacity
                          bg-bg-card border border-bg-border rounded px-2 py-1 text-[10px] text-text-primary
                          whitespace-nowrap shadow-xl">
                        {val} ventes
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-text-muted">Faible</span>
        <div className="flex gap-0.5">
          {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1].map((v) => (
            <div key={v} className={`w-5 h-3 rounded-sm ${heatColor(v)}`} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">Fort</span>
      </div>
    </div>
  );
}
